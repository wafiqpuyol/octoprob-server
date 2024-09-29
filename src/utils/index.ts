import { PubSub } from 'graphql-subscriptions';

// To get Timezone
export const appTimeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const pubSub: PubSub = new PubSub();