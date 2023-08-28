// For schema
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchema } from '@graphql-tools/load'
import { addResolversToSchema } from '@graphql-tools/schema'
import path from 'path'

// For prisma
import { Context, SubsContext } from './context'
import { Link, User, Prisma } from "@prisma/client"; // prisma create a Link type for us

// For auth
import { APP_SECRET } from "./auth";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";

// For subscriptions
const NEW_LINK_TOPIC = "newLink"
const NEW_VOTE_TOPIC = "newVote"


const resolvers = {
	Query: {
		info: async () => `This is the API of a Hackernews Clone`,
		feed: async (
			parent: unknown,
			args: {
				filter?: string,
				skip?: number,
				take?: number,
				orderBy?: {
					description?: Prisma.SortOrder;
					url?: Prisma.SortOrder;
					createdAt?: Prisma.SortOrder;
				};
			},
			context: Context
		) => {
			const where = args.filter
				? {
					OR: [
						{ description: { contains: args.filter } },
						{ url: { contains: args.filter } },
					],
				}
				: {};

			const totalCount = await context.prisma.link.count({ where });
			const links = context.prisma.link.findMany({
				where,
				skip: args.skip,
				take: args.take,
				orderBy: args.orderBy,
			});

			return {
				count: totalCount,
				links
			}
		},
	},
	// this is trivial, even we don't write, it still be able to create corresponding resolver
	// Link: {
	//   id: (parent: Link) => parent.id,
	//   description: (parent: Link) => parent.description,
	//   url: (parent: Link) => parent.url,
	// },
	Link: {
		postedBy: async (parent: Link, args: {}, context: Context) => {
			if (!parent.postedById) {
				return null;
			}

			// get user by using populate function
			const user = await context.prisma.link
				.findUnique({ where: { id: parent.id } })
				.postedBy();

			if (user) {
				// clean the password before return to frontend
				const { password: _, ...modifiedUser } = user;
				// console.log(modifiedUser)
				return modifiedUser
			}

			return null
		},
		votes: (parent: Link, args: {}, context: Context) =>
			context.prisma.link.findUnique({ where: { id: parent.id } }).votes(),
	},
	Mutation: {
		post: async (
			parent: unknown,
			args: { description: string, url: string },
			context: Context
		) => {
			// check if logged in
			if (!context.currentUserId) {
				throw new Error("Unauthenticated!");
			}

			const newLink = await context.prisma.link.create({
				data: {
					url: args.url,
					description: args.description,
					postedBy: { connect: { id: context.currentUserId } },
				},
			});

			// publish to topic
			context.pubsub.publish(NEW_LINK_TOPIC, {
				newLink
			});


			return newLink;
		},
		signup: async (
			parent: unknown,
			args: { email: string; password: string; name: string },
			context: Context
		) => {
			// encrypt the pwd
			const password = await hash(args.password, 10);

			const user = await context.prisma.user.create({
				data: { ...args, password },
				// after create only return these fields
				select: {
					id: true,
					name: true,
					email: true,
					links: true
				}
			});

			const token = sign({ userId: user.id }, APP_SECRET);

			return {
				token,
				user,
			};
		},
		login: async (
			parent: unknown,
			args: { email: string; password: string },
			context: Context
		) => {
			const user = await context.prisma.user.findUnique({
				where: { email: args.email },
			});
			if (!user) {
				throw new Error("No such user found");
			}

			const valid = await compare(args.password, user.password);
			if (!valid) {
				throw new Error("Invalid password");
			}

			const token = sign({ userId: user.id }, APP_SECRET);

			// clean the password before return to frontend
			const { password: _, ...modifiedUser } = user;

			return {
				token,
				modifiedUser,
			};
		},
		vote: async (
			parent: unknown,
			args: { linkId: number },
			context: Context
		) => {
			if (!context.currentUserId) {
				throw new Error("You must login in order to use upvote!");
			}

			const userId = context.currentUserId;

			const vote = await context.prisma.vote.findUnique({
				where: {
					linkId_userId: {
						linkId: Number(args.linkId),
						userId: userId,
					},
				},
			});

			if (vote !== null) {
				throw new Error(`Already voted for link: ${args.linkId}`);
			}

			const newVote = await context.prisma.vote.create({
				data: {
					user: { connect: { id: userId } },
					link: { connect: { id: Number(args.linkId) } },
				},
			});

			context.pubsub.publish("newVote", { newVote });

			return newVote;
		},
	},
	User: {
		links: (parent: User, args: {}, context: Context) =>
			// get array of links by using populate function
			context.prisma.user.findUnique({ where: { id: parent.id } }).links(),
	},
	Subscription: {
		newLink: {
			subscribe: (
				parent: unknown,
				args: {},
				context: SubsContext
			) => {
				// console.log(context.pubsub)
				return context.pubsub.asyncIterator(NEW_LINK_TOPIC)
			}
		},
		newVote: {
			subscribe: (
				parent: unknown,
				args: {},
				context: SubsContext
			) => {
				// console.log(context.pubsub)
				return context.pubsub.asyncIterator(NEW_VOTE_TOPIC)
			}
		}
	},
	Vote: {
		link: (parent: User, args: {}, context: Context) =>
			context.prisma.vote.findUnique({ where: { id: parent.id } }).link(),
		user: (parent: User, args: {}, context: Context) =>
			context.prisma.vote.findUnique({ where: { id: parent.id } }).user(),
	},
}

export const setupSchema = async () => {

	const schema = await loadSchema(path.join(__dirname, 'schema.graphql'), {
		// load from a single schema file
		loaders: [new GraphQLFileLoader()]
	})

	const schemaWithResolvers = addResolversToSchema({
		schema,
		resolvers: resolvers
	})

	return schemaWithResolvers
}


