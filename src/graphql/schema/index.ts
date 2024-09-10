import { mergeTypeDefs } from '@graphql-tools/merge';
import { userSchema } from "./user"
import { notificationSchema } from "./notification"

export const mergedSchema = mergeTypeDefs([userSchema, notificationSchema])