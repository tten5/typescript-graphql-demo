// Not use standalone Apollo server
// but integrate Apollo server with Express
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http'
import cors from 'cors';
import { json } from 'body-parser';

// import { execute, parse } from "graphql";
import { setupSchema } from "./schema";
import { context, Context, subsContext } from "./context";

// For websocket
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

async function main() {
	const schema = await setupSchema()

	/*
	  RUN DIRECT QUERY TO TEST
	*/

	// const myQuery = parse(`query { info }`);

	// const result = await execute({
	//   schema,
	//   document: myQuery,
	// });

	// console.log(result);

	const app = express(); 
	// Our httpServer handles incoming requests to our Express app.
	const httpServer = http.createServer(app);

	// Creating the WebSocket server
	const wsServer = new WebSocketServer({
		server: httpServer,
  		path: '/',
	});


	// Save the returned server's info so we can shutdown this server later
	const serverCleanup = useServer({
		schema,
		//  The ctx object here represents the context of your subscription server
		// not the GraphQL operation contextValue that's passed to your resolvers.
		context: async (ctx, msg, args) => {

			// what return here will be the context object of subscribe resolver
			return subsContext
		},
		onConnect: async (ctx) => {

			// apollo sandbox does not have connectionParams now so cannot test

			// Check authentication every time a client connects.
			// const token = ctx.connectionParams && ctx.connectionParams.authorization
			// 	? String(ctx.connectionParams.authorization)
			// 	: ''

			// if (!verifyToken(token)) {
	  
			// // You can return false to close the connection  or throw an explicit error
	  
			//   throw new Error('Auth token missing!');
	  
			// }
			console.log("WS connected")
	  
		},
		onDisconnect(ctx, code, reason) {

			console.log('WS disconnected!');
	  
		},
	}, wsServer);

	// Set up ApolloServer.
	const server = new ApolloServer<Context>({
		schema,
		plugins: [
			// Proper shutdown for the HTTP server.
			ApolloServerPluginDrainHttpServer({ httpServer }),
			// Proper shutdown for the WebSocket server.
			{
				async serverWillStart() {
					return {
						async drainServer() {
							await serverCleanup.dispose();
						},
					};
				},
			},
		],
	});

	// Note you must call `start()` on the `ApolloServer`
	// instance before passing the instance to `expressMiddleware`
	await server.start();

	// Set up our Express middleware to handle CORS, body parsing,
	// and our expressMiddleware function.
	// also specify the path where we'd like to mount our server
	app.use('/',
		cors<cors.CorsRequest>(),
		json(),
		// expressMiddleware accepts these arguments:
		// an Apollo Server instance and optional configuration options
		expressMiddleware(server, {
			context: context 
		})
	);

	const PORT = 3000;
	httpServer.listen(PORT, () => {
		console.log(`🚀  Server ready at port ${PORT}`);
	});
}

main();


