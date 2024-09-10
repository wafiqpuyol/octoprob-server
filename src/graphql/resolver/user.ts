import { AppContext } from "@app/interfaces/app.interface";
import { IUserDocument, IUserResponse } from "@app/interfaces/user.interface";
import { getUserByUsernameAndEmail, createUser, getUserByEmail, getUserBySocialId } from "@app/services/user.service";
import { getAllNotificationGroupByUserId } from "@app/services/notification.service";
import { GraphQLError } from "graphql";
import { RegisterSchema, LoginSchema, SocialAuth } from "../../schema/user"
import { User } from "../../utils/types";
import jwt from 'jsonwebtoken';
import { config } from "../../server/config"
import { hash, compare } from 'bcryptjs'
import { protectedRoute } from "../../guard/index"

export const userResolver = {

    Query: {
        async checkCurrentUser(_: undefined, __: undefined, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const notifications = await getAllNotificationGroupByUserId(req.currentUser!.id);
            return {
                user: {
                    id: req.currentUser?.id,
                    username: req.currentUser?.username,
                    email: req.currentUser?.email,
                    createdAt: req.currentUser?.createdAt
                },
                notifications
            };
        }
    },
    Mutation: {
        async registerUser(_: undefined, args: { user: IUserDocument }) {
            const { user } = args
            const validatedRegistrationDetails = RegisterSchema().safeParse(user);
            if (!validatedRegistrationDetails.success) {
                const format = validatedRegistrationDetails.error.format();
                const errorMessage = (format.email?._errors || format.password?._errors || format.username?._errors) as string[]
                throw new GraphQLError(errorMessage[0]);
            }
            const { email, password, username } = validatedRegistrationDetails.data;
            const checkIfUserExist: User | null = await getUserByUsernameAndEmail(username, email);
            if (checkIfUserExist) {
                throw new GraphQLError('User already exists with this Email or Username.');
            }
            const hashedPassword = await hash(password as string, 10)
            const newUser: IUserResponse = await createUser({ email, password: hashedPassword, username });
            return { ...newUser, message: "Registration Successful" };
        },

        async loginUser(_: undefined, args: { email: string; password: string }, contextValue: AppContext) {
            const { req } = contextValue;
            const validatedLoginDetails = LoginSchema().safeParse(args);
            if (!validatedLoginDetails.success) {
                const format = validatedLoginDetails.error.format();
                const errorMessage = (format.email?._errors || format.password?._errors) as string[]
                throw new GraphQLError(errorMessage[0]);
            }
            const { email, password } = validatedLoginDetails.data;
            const checkIfUserExist = await getUserByEmail(email);
            console.log(checkIfUserExist)
            if (!checkIfUserExist) {
                throw new GraphQLError(`User doesn't exists with this Username`);
            }
            if (checkIfUserExist.password) {
                const isPasswordMatch = await compare(password, checkIfUserExist.password);
                if (!isPasswordMatch) throw new GraphQLError("Invalid Credentials");
            }

            const userJwt: string = jwt.sign(
                {
                    id: checkIfUserExist.id,
                    email: checkIfUserExist.email,
                    username: checkIfUserExist.username,
                    createdAt: checkIfUserExist.createdAt
                },
                config.JWT_TOKEN
            );
            req.session = { jwt: userJwt, enableAutomaticRefresh: false };
            const user: IUserDocument = {
                id: checkIfUserExist.id,
                email: checkIfUserExist.email,
                createdAt: checkIfUserExist.createdAt,
                username: checkIfUserExist.username,
            }
            const notifications = await getAllNotificationGroupByUserId(checkIfUserExist.id)
            return {
                user,
                notifications,
                message: "Login Successfully"
            }
        },

        async authSocialUser(_: undefined, args: { user: IUserDocument }, contextValue: AppContext) {
            const { req } = contextValue;
            const { user } = args;
            const validatedRegistrationDetails = SocialAuth().safeParse(user);
            if (!validatedRegistrationDetails.success) {
                console.log(validatedRegistrationDetails.error.format());
                const format = validatedRegistrationDetails.error.format();
                const errorMessage = (format.username?._errors || format.socialId?._errors || format.type?._errors) as string[]
                throw new GraphQLError(errorMessage[0]);
            }
            const { email, username, socialId } = validatedRegistrationDetails.data
            const facebookId = (user.type === "facebook") ? socialId : undefined
            const googleId = (user.type === "google") ? socialId : undefined
            const checkIfUserExist = await getUserBySocialId(facebookId, googleId);
            if (checkIfUserExist) {
                const userJwt: string = jwt.sign(
                    {
                        id: checkIfUserExist.id,
                        email: checkIfUserExist.email,
                        username: checkIfUserExist.username,
                        createdAt: checkIfUserExist.createdAt
                    },
                    config.JWT_TOKEN
                );
                req.session = { jwt: userJwt, enableAutomaticRefresh: false };
                const user: IUserDocument = {
                    id: checkIfUserExist.id,
                    email: checkIfUserExist.email,
                    createdAt: checkIfUserExist.createdAt,
                    username: checkIfUserExist.username,
                }
                const notifications = await getAllNotificationGroupByUserId(checkIfUserExist.id)
                return {
                    user,
                    notifications
                }
            } else {
                const payload: IUserDocument = {
                    username,
                    email,
                    ...(user.type === 'google' ? {
                        googleId: socialId
                    } : { facebookId: socialId })
                } as IUserDocument;
                const newUser: IUserResponse = await createUser(payload);
                const userJwt: string = jwt.sign(
                    {
                        id: newUser.user.id,
                        email: newUser.user.email,
                        username: newUser.user.username,
                        createdAt: newUser.user.createdAt
                    },
                    config.JWT_TOKEN
                );
                req.session = { jwt: userJwt, enableAutomaticRefresh: false };
                return {
                    ...newUser,
                    message: "LogIn Successful"
                }
            }
        },

        logout(_: undefined, __: undefined, contextValue: AppContext) {
            const { req } = contextValue;
            req.session = null;
            req.currentUser = undefined;
            return { message: "Logout Successful" };
        }
    },
    User: {
        createdAt: (user: IUserDocument) => new Date(user.createdAt!).toISOString()
    }
}       
