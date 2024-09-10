import { IAuthPayload } from "@app/interfaces/user.interface";
import { verify } from "jsonwebtoken";
import type { Request } from "express"
import { GraphQLError } from "graphql";
import { config } from "../server/config"

export const protectedRoute = (req: Request): void => {
    if (!req.session?.jwt) {
        throw new GraphQLError('Please login again.');
    }
    try {
        const payload: IAuthPayload = verify(req.session?.jwt, config.JWT_TOKEN as string) as IAuthPayload;
        req.currentUser = payload;
        console.log("-------->", payload);
    } catch (error) {
        throw new GraphQLError('Please login again.');
    }
};