import prisma from "../server/database"
import { IUserDocument, IUserResponse } from "../interfaces/user.interface"
import { generateRandomId } from "../utils/common"
import { User } from "../utils/types"


export const createUser = async (payload: IUserDocument): Promise<IUserResponse> => {
    try {
        return await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    id: generateRandomId(),
                    ...payload
                }
            })

            const notification = await tx.notifications.create({
                data: {
                    id: generateRandomId(),
                    userId: user.id,
                    groupName: 'Default Contact Group',
                    emails: JSON.stringify([user.email])
                }
            })
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    createdAt: user.createdAt,
                    facebookId: user.facebookId || undefined,
                    googleId: user.googleId || undefined,
                    type: payload.type
                },
                notifications: [notification]
            }
        })

    } catch (error) {
        console.log(error.message);
        throw new Error(error.message);
    }
}

export const getUserByUsernameAndEmail = (username: string, email: string): Promise<User | null> => {
    console.log(username, email);
    try {
        const user = prisma.user.findFirst({
            where: {
                AND: [
                    { username },
                    { email }
                ]
            }
        })
        return user;

    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
}

export const getUserBySocialId = (facebookId: string | undefined, googleId: string | undefined): Promise<User | null> => {
    try {
        const user = prisma.user.findFirst({
            where: {
                OR: [
                    { facebookId },
                    { googleId }
                ]
            }
        })
        return user;
    } catch (error) {
        throw new Error(error);
    }
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
        const user: User | null = await prisma.user.findFirst(
            {
                where: {
                    email
                }
            })
        return user;
    } catch (error) {
        throw new Error(error);
    }
}