import * as dotenv from 'dotenv';
import * as jwt from "jsonwebtoken";

dotenv.config({ path: __dirname + '/.env.app' });

if (!process.env.APP_SECRET) {
    console.log("Please check the env again and make sure everything is there")
    process.exit(1)
}

export const APP_SECRET : string = process.env.APP_SECRET;

export interface AuthTokenPayload {  
    userId: number;
}

export function decodeAuthHeader(authHeader: String): AuthTokenPayload { 
    // "Bearer MY_TOKEN_HERE"
    const token = authHeader.replace("Bearer ", "");  

    if (!token) {
        throw new Error("No token found");
    }
    return jwt.verify(token, APP_SECRET) as AuthTokenPayload;  
}

export function verifyToken(token: string): AuthTokenPayload { 
    if (!token) {
        throw new Error("No token found");
    }
    return jwt.verify(token, APP_SECRET) as AuthTokenPayload;  
}