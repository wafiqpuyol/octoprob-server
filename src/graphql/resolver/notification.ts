import { AppContext } from '@app/interfaces/app.interface';
import { INotificationDocument } from '@app/interfaces/notification.interface';
import { createNotificationGroup, deleteNotificationGroup, getAllNotificationGroupByUserId, getSingleNotificationGroup, updateNotificationGroup } from '@app/services/notification.service';
import { protectedRoute } from '@app/guard';

export const NotificationResolver = {
    Query: {
        async getUserNotificationGroups(_: undefined, { userId }: { userId: string }, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const notifications = await getAllNotificationGroupByUserId(parseInt(userId));
            return {
                notifications
            };
        }
    },
    Mutation: {
        async createNotificationGroup(_: undefined, args: { group: INotificationDocument }, contextValue: AppContext) {
            const { req } = contextValue;
            if (!args.group.groupName) {
                throw new Error("Group name is required");
            }
            protectedRoute(req);
            const notification: INotificationDocument = await createNotificationGroup(args.group!);
            return {
                notifications: [notification]
            };
        },
        async updateNotificationGroup(_: undefined, args: { notificationId: string, payload: INotificationDocument }, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const { notificationId, payload } = args;
            const isNotificationExist = await getSingleNotificationGroup(parseInt(notificationId))
            if (!isNotificationExist) {
                throw new Error(`Notification with id ${notificationId} does not exist`);
            }

            // TODO: make payload partial / craete seperate update notification type
            const notification = await updateNotificationGroup(isNotificationExist.id, payload);
            return {
                notifications: [notification]
            };
        },
        async deleteNotificationGroup(_: undefined, args: { notificationId: string }, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const { notificationId } = args;
            const isNotificationExist = await getSingleNotificationGroup(parseInt(notificationId))
            if (!isNotificationExist) {
                throw new Error(`Notification with id ${notificationId} does not exist`);
            }
            await deleteNotificationGroup(isNotificationExist.id);
            return {
                id: notificationId
            };
        }
    }
};
