import { PrismaClient } from "@prisma/client";
import { decodeAuthHeader } from "./auth";   
import { Request } from "express";  

import { PubSub,  } from 'graphql-subscriptions';

const prisma = new PrismaClient(); 
const pubsub = new PubSub();

export interface Context {    
    prisma: PrismaClient;
    currentUserId?: number; 
    pubsub: PubSub;
}

// subscription context
export interface SubsContext {
    prisma: PrismaClient;
    pubsub: PubSub;
}

// arg is an object that has req property, that req property has type Request 
export const context = async ({ req }: { req: Request }) => {  
    // if there is client token, decode it 
    const token =
        req && req.headers.authorization
            ? decodeAuthHeader(req.headers.authorization)
            : null;

    return {  
        prisma,
        currentUserId: token?.userId, 
        pubsub
    };
};

export const subsContext = {
    prisma,
    pubsub
}

  

