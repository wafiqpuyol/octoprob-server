import { createMonitor, toggleMonitor, updateSingleMonitor, deleteSingleMonitor, getMonitorById, getUserMonitors, startCreatedMonitors, getUserActiveMonitors } from "@app/services/monitor.service"
import { IMonitorArgs, IMonitorDocument } from "@app/interfaces/monitor.interface";
import { getSingleNotificationGroup } from "@app/services/notification.service";
import { protectedRoute } from "@app/guard"
import { AppContext } from "@app/interfaces/app.interface";
import { some, toLower } from 'lodash';
import { stopSingleBackgroundJob } from "../../utils/job"
import { resumeMonitors, uptimePercentage } from "@app/utils/common";
import { appTimeZone } from "../../utils/index"
import { startSingleJob } from "../../utils/job"
import { pubSub } from "../../utils/index"
import { getHeartbeats } from "../../services/monitor.service"
import { IHeartbeat } from "@app/interfaces/heartbeat.interface";
// import { IHeartbeat } from "../../interfaces/heartbeat.interface"

export const MonitorResolver = {

    Query: {
        async getSingleMonitor(_: undefined, { monitorId }: { monitorId: string }, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const monitor: IMonitorDocument = await getMonitorById(parseInt(monitorId!));
            return {
                userId: monitor.userId,
                monitors: [monitor]
            };
        },
        async getUserMonitors(_: undefined, { userId }: { userId: string }, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const monitors: IMonitorDocument[] = await getUserMonitors(parseInt(userId));
            return {
                userId: userId,
                monitors
            };
        },

        async autoRefresh(_: undefined, { userId, refresh }: { userId: string, refresh: boolean }, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            if (refresh) {
                req.session = {
                    ...req.session,
                    enableAutomaticRefresh: true
                };
                startSingleJob(`${toLower(req.currentUser?.username)}`, appTimeZone, 10, async () => {
                    const monitors: IMonitorDocument[] = await getUserActiveMonitors(parseInt(userId!));
                    pubSub.publish('MONITORS_UPDATED', {
                        monitorsUpdated: {
                            userId: parseInt(userId, 10),
                            monitors
                        }
                    });
                });
            } else {
                req.session = {
                    ...req.session,
                    enableAutomaticRefresh: false
                };
                stopSingleBackgroundJob(`${toLower(req.currentUser?.username)}`);
            }
            return {
                refresh
            };
        }

    },

    Mutation: {
        async createMonitor(_: undefined, args: IMonitorArgs, contextValue: AppContext) {
            const { req } = contextValue
            const { monitor } = args;
            protectedRoute(req);
            const result = await createMonitor(monitor);
            if (monitor.active && result.active) {
                startCreatedMonitors(result, toLower(monitor.name), monitor.type);
            }
            return {
                userId: req.currentUser?.id,
                monitors: [result]
            };
        },

        async toggleMonitor(_: undefined, args: IMonitorArgs, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const { monitorId, userId, name, active } = args.monitor!;
            const results: IMonitorDocument[] = await toggleMonitor(monitorId!, userId, active as boolean);
            const hasActiveMonitors: boolean = some(results, (monitor: IMonitorDocument) => monitor.active);
            /**
             * Stop auto refresh if there are no active monitors for single user
             */
            if (!hasActiveMonitors) {
                req.session = {
                    ...req.session,
                    enableAutomaticRefresh: false
                };
                stopSingleBackgroundJob(`${toLower(req.currentUser?.username)}`);
            }
            if (!active) {
                stopSingleBackgroundJob(name, monitorId!);
            } else {
                // TODO add resumeMonitors()
                resumeMonitors(monitorId!);
            }
            return {
                userId: req.currentUser?.id,
                monitors: results
            };
        },

        async updateMonitor(_: undefined, args: IMonitorArgs, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const { monitorId, userId, monitor } = args;
            const monitors = await updateSingleMonitor(parseInt(`${monitorId}`), parseInt(`${userId}`), monitor);
            return {
                monitors
            };
        },

        async deleteMonitor(_: undefined, args: IMonitorArgs, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const { monitorId, userId, type } = args;
            await deleteSingleMonitor(parseInt(`${monitorId}`), parseInt(`${userId}`), type!);
            return {
                id: monitorId
            };
        },
    },

    MonitorResult: {
        lastChanged: (monitor: IMonitorDocument) => JSON.stringify(monitor.lastChanged),
        responseTime: (monitor: IMonitorDocument) => {
            return monitor.responseTime ? parseInt(`${monitor.responseTime}`) : monitor.responseTime;
        },
        notifications: (monitor: IMonitorDocument) => {
            return getSingleNotificationGroup(monitor.notificationId!);
        },
        heartbeats: async (monitor: IMonitorDocument) => {
            // TODO fix this hardcoded [duration]
            const heartbeats = await getHeartbeats(monitor.type, monitor.id!, 24);
            return heartbeats.slice(0, 16);
        },
        uptime: async (monitor: IMonitorDocument): Promise<number> => {
            const heartbeats: IHeartbeat[] = await getHeartbeats(monitor.type, monitor.id!, 24);
            return uptimePercentage(heartbeats);
        }
    },

    Subscription: {
        monitorsUpdated: {
            subscribe: () => pubSub.asyncIterator(['MONITORS_UPDATED'])
        }
    }
}