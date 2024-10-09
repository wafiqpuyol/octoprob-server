import { userResolver } from "./user"
import { NotificationResolver } from "./notification"
import { MonitorResolver } from "./monitor"
import { HeartbeatResolver } from "./heartbeats"
import { SSLMonitorResolver } from "./ssl"
export const resolvers = [
    userResolver, NotificationResolver, MonitorResolver, HeartbeatResolver, SSLMonitorResolver
];