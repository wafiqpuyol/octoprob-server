import { INotificationDocument } from "@app/interfaces/notification.interface";
import prisma from "../server/database"
import { generateRandomId } from "@app/utils/common";

export const createNotificationGroup = async (payload: INotificationDocument) => {
    try {
        const user = await prisma.notifications.create({
            data: {
                id: generateRandomId(),
                ...payload
            }
        })
        return user;
    } catch (error) {
        throw new Error(error);
    }
}

export const getSingleNotificationGroup = async (notificationId: number) => {
    try {
        const user = await prisma.notifications.findFirst({
            where: {
                id: notificationId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return user;
    } catch (error) {
        throw new Error(error);
    }
}

export const getAllNotificationGroupByUserId = async (userId: number) => {
    try {
        const user = await prisma.notifications.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return user;
    } catch (error) {
        throw new Error(error);
    }
}

export const updateNotificationGroup = async (notificationId: number, payload: INotificationDocument) => {
    try {
        const user = await prisma.notifications.update({
            where: {
                id: notificationId
            },
            data: {
                ...payload
            }
        })
        return user;
    } catch (error) {
        throw new Error(error);
    }
}

export const deleteNotificationGroup = async (notificationId: number) => {
    try {
        await prisma.user.delete({
            where: {
                id: notificationId
            }
        })
    } catch (error) {
        throw new Error(error);
    }
}