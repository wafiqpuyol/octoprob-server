import { mergeTypeDefs } from '@graphql-tools/merge';
import { userSchema } from "./user"

export const mergedSchema = mergeTypeDefs([userSchema])