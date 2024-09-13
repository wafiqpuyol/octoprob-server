import { ApolloServer, BaseContext } from "@apollo/server";
import 'express-async-errors';
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { resolvers } from "@app/graphql/resolver";
import { mergedSchema } from "@app/graphql/schema";
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLSchema } from 'graphql';
import { AppContext } from "@app/interfaces/app.interface";
import cookieSession from 'cookie-session';
import cors from "cors";
import type { Express, NextFunction, Request, Response } from "express";
import express, { json, urlencoded } from "express";
import http from 'http';
import { config } from "./config";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customFormat)

export class SingletonServer {
    private static instance: SingletonServer;
    private app: Express;
    private httpServer: http.Server;
    private gqlServer: ApolloServer

    private constructor(app: Express) {
        this.app = app;
        this.httpServer = new http.Server(app);
        const schema: GraphQLSchema = makeExecutableSchema({ typeDefs: mergedSchema, resolvers });
        this.gqlServer = new ApolloServer<AppContext | BaseContext>({
            schema,
            introspection: config.NODE_ENV !== 'production',
            plugins: [
                ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
                config.NODE_ENV === 'production'
                    ? ApolloServerPluginLandingPageDisabled()
                    : ApolloServerPluginLandingPageLocalDefault({ embed: true })
            ]
        });
    }

    static getInstance() {
        if (!this.instance) {
            const appInstance: Express = express();
            this.instance = new SingletonServer(appInstance)
        }
        return this.instance;
    }

    async start(): Promise<void> {
        await this.gqlServer.start();
        this.standardMiddleware(this.app)
        this.startHttpServer()
    }

    private standardMiddleware(app: Express): void {
        app.set('trust proxy', 1);
        app.use((_req: Request, res: Response, next: NextFunction) => {
            res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
            next();
        });
        app.use(
            cookieSession({
                name: 'session',
                keys: [config.SECRET_KEY_ONE, config.SECRET_KEY_TWO],
                maxAge: 24 * 7 * 3600000,
                secure: config.NODE_ENV !== 'development',
                ...(config.NODE_ENV !== 'development' && {
                    sameSite: 'none'
                })
            })
        );
        app.use(cors({
            origin: config.CLIENT_URL,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        }));

        this.graphqlRoute(app)
        this.healthRoute(app)
    }


    private graphqlRoute(app: Express): void {
        app.use(
            '/graphql',
            cors({
                origin: config.CLIENT_URL,
                credentials: true
            }),
            json({ limit: '200mb' }),
            urlencoded({ extended: true, limit: '200mb' }),
            expressMiddleware(this.gqlServer, {
                context: async ({ req, res }: { req: Request; res: Response }) => {
                    return { req, res };
                }
            })
        );
    }

    private healthRoute(app: Express): void {
        app.get('/health', (_req: Request, res: Response) => {
            res.status(200).send("<h1> Octoprob monitor service is healthy and OK.</h1>");
        });
    }


    private async startHttpServer(): Promise<void> {
        try {
            const serverPort = parseInt(config.PORT) || 3000
            this.httpServer.listen(serverPort, () => {
                console.info(`Server is running on port ${serverPort}`)
            })
        } catch (error) {
            console.error("StartHttpServer() error: ", error)
        }
    }
}