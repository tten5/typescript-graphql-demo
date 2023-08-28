# Typescript-GraphQl demo 

- To learn and practice how to use GraphQL with Typescript 

## Techstacks:

- NodeJs
- Typescript
- Server: `@apollo/server` integrated with ExpressJs
    - Use `graph-ws` and `ws` for WebSocket server 
- Create schema with `@graphql-tools` 
- ORM for Database: use `Prisma` to access database inside of GraphQL resolvers
- Database: PostgreSQL

## How to run 

### 1. First setup
- Download necessary packages
```
npm install
```
- Add a `.env` file at root 
```
DATABASE_URL=<YOUR DATABASE URL>
```
- Add a `.env.app` file at `/src`
```
APP_SECRET=<YOUR SECRET>
```
- Apply prisma migration
```
npx prisma migrate deploy
```

### 2. Run server
```
npm run dev
```


## Implement Details
- Interact with API through Apollo Sandbox at `localhost:3000`
- GraphQL Subscriptions is implemented with `graphql-subscriptions`
- However, based on official repo of [graphql-subscription](https://github.com/apollographql/graphql-subscriptions), this npm package is only for demo version. For production, please check the official repo link above.  
- Topics covered in this demo:
    + Query 
    + Mutation 
    + Subscription: use web socket 
    + Authentication: use JWT
    + Filter, Pagination, Sort 
    + Use Prisma ORM to manage database
- Not yet implemented: Authentication for web socket connection because Apollo Sandbox has not supported `connectionParams` yet
