import prisma from "@app/server/database"
import { getSingleNotificationGroup } from "@app/services/notification.service";
import { IMonitorDocument } from "@app/interfaces/monitor.interface";
import dayjs from 'dayjs';
import { HTTP_TYPE, MONGO_TYPE, REDIS_TYPE, TCP_TYPE } from "../utils/constants"
import logger from "../server/logger"
import { httpStatusMonitor } from "./http.service";
import { toLower } from "lodash";
import { IHeartbeat } from "../interfaces/heartbeat.interface"
import { getHttpHeartBeatsByDuration } from "../services/http.service"
import { uptimePercentage } from "../utils/common"
import { getMongoHeartBeatsByDuration } from "../services/mongo.service"
import { mongoStatusMonitor } from "../services/mongo.service"
import { getRedisHeartBeatsByDuration, redisStatusMonitor } from "../services/redis.service"
import { getTcpHeartBeatsByDuration, tcpStatusMonitor } from "../services/tcp.service"

export const createMonitor = async (payload: IMonitorDocument) => {
    try {
        const result = await prisma.monitor.create({ data: payload });
        return result;
    } catch (error) {
        throw new Error(error);
    }
}

export const getUserMonitors = async (userId: number, active?: boolean) => {
    try {
        const monitors = await prisma.monitor.findMany({
            where: {
                AND: [
                    {
                        userId,
                        ...(active && {
                            active: true
                        })
                    }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },

        })
        console.log("Monitor ^^^^^^^^^^^^^^^^^^^^", monitors[0].contentType);
        return monitors;
    } catch (error) {
        throw new Error(error);
    }
};

export const getAllUsersActiveMonitors = async () => {
    try {
        const monitors = await prisma.monitor.findMany({
            where: { active: true },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return monitors;
    } catch (error) {
        throw new Error(error);
    }
};

export const getMonitorById = async (monitorId: number) => {
    try {
        const monitor = await prisma.monitor.findFirst({
            where: { id: monitorId }
        });
        if (!monitor) throw new Error("Monitor not found")
        let updatedMonitor: IMonitorDocument = { ...monitor };
        const notifications = await getSingleNotificationGroup(updatedMonitor?.notificationId!);
        if (!notifications) {
            throw new Error('Notification not found');
        }
        updatedMonitor = { ...updatedMonitor, notifications };
        return updatedMonitor;
    } catch (error) {
        throw new Error(error);
    }
};

export const toggleMonitor = async (monitorId: number, userId: number, active: boolean) => {
    try {
        await prisma.monitor.update({
            where: {
                id: monitorId,
                userId
            },
            data: {
                active
            }
        });
        const result = await getUserMonitors(userId);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

export const updateSingleMonitor = async (monitorId: number, userId: number, data: Partial<IMonitorDocument>) => {
    try {
        await prisma.monitor.update({
            where: { id: monitorId },
            data
        });
        const result = await getUserMonitors(userId);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

export const updateMonitorStatus = async (monitor: IMonitorDocument, timestamp: number, type: string) => {
    try {
        const now = timestamp ? dayjs(timestamp).toDate() : dayjs().toDate();
        const { id, status } = monitor;
        const updatedMonitor: IMonitorDocument = { ...monitor };
        updatedMonitor.status = type === 'success' ? 0 : 1;
        const isStatus = type === 'success' ? true : false;
        if (isStatus && status === 1) {
            updatedMonitor.lastChanged = now;
        } else if (!isStatus && status === 0) {
            updatedMonitor.lastChanged = now;
        }
        // delete (updatedMonitor as { id?: number }).id;
        await prisma.monitor.update({
            where: {
                id
            },
            data: {
                id: updatedMonitor.id,
                notificationId: updatedMonitor.notificationId,
                name: updatedMonitor.name,
                active: updatedMonitor.active,
                status: updatedMonitor.status,
                userId: updatedMonitor.userId,
                frequency: updatedMonitor.frequency,
                alertThreshold: updatedMonitor.alertThreshold,
                url: updatedMonitor.url,
                type: updatedMonitor.type,
                lastChanged: updatedMonitor.lastChanged,
                timeout: updatedMonitor.timeout,
                uptime: updatedMonitor.uptime,
                redirects: updatedMonitor.redirects,
                method: updatedMonitor.method,
                headers: updatedMonitor.headers,
                body: updatedMonitor.body,
                httpAuthMethod: updatedMonitor.httpAuthMethod,
                basicAuthUser: updatedMonitor.basicAuthUser,
                basicAuthPass: updatedMonitor.basicAuthPass,
                bearerToken: updatedMonitor.bearerToken,
                contentType: updatedMonitor.contentType,
                statusCode: updatedMonitor.statusCode,
                responseTime: updatedMonitor.responseTime,
                connection: updatedMonitor.connection,
                port: updatedMonitor.port,
            }

        });
        return updatedMonitor;
    } catch (error) {
        throw new Error(error);
    }
};
// @ts-ignore
export const deleteSingleMonitor = async (monitorId: number, userId: number, type: string) => {
    try {
        await deleteMonitorTypeHeartbeats(monitorId, type);
        await prisma.monitor.delete({
            where: { id: monitorId }
        });
        const result = await getUserMonitors(userId);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

export const getUserActiveMonitors = async (userId: number): Promise<IMonitorDocument[]> => {
    try {
        let heartbeats: IHeartbeat[] = [];
        const updatedMonitors: IMonitorDocument[] = [];
        const monitors: IMonitorDocument[] = await getUserMonitors(userId, true);
        for (let monitor of monitors) {
            const group = await getSingleNotificationGroup(monitor.notificationId!);
            heartbeats = await getHeartbeats(monitor.type, monitor.id!, 24);
            const uptime: number = uptimePercentage(heartbeats);
            monitor = {
                ...monitor,
                uptime,
                heartbeats: heartbeats.slice(0, 16),
                notifications: group!
            };
            updatedMonitors.push(monitor);
        }
        return updatedMonitors;
    } catch (error) {
        throw new Error(error);
    }
};

export const getHeartbeats = async (type: string, monitorId: number, duration: number): Promise<IHeartbeat[]> => {
    let heartbeats: IHeartbeat[] = [];

    if (type === HTTP_TYPE) {
        console.log("Get Heart Beat");
        heartbeats = await getHttpHeartBeatsByDuration(monitorId, duration);
    }
    // TODO getHeartbeats
    if (type === TCP_TYPE) {
        heartbeats = await getTcpHeartBeatsByDuration(monitorId, duration);
    }
    if (type === MONGO_TYPE) {
        heartbeats = await getMongoHeartBeatsByDuration(monitorId, duration);
    }
    if (type === REDIS_TYPE) {
        heartbeats = await getRedisHeartBeatsByDuration(monitorId, duration);
    }
    return heartbeats;
};


// TODO this function hasn't completed yet
export const startCreatedMonitors = (monitor: IMonitorDocument, name: string, type: string): void => {
    console.log("type is ", type);
    if (type === HTTP_TYPE) {
        logger.info("Starting monitoring for " + name + " - " + monitor.name);
        httpStatusMonitor(monitor, toLower(name));
    }
    if (type === TCP_TYPE) {
        logger.info("Starting monitoring for " + name + " - " + monitor.name);
        tcpStatusMonitor(monitor!, toLower(name));
    }
    if (type === MONGO_TYPE) {
        logger.info("Starting monitoring for " + name + " - " + monitor.name);
        mongoStatusMonitor(monitor!, toLower(name));
    }
    if (type === REDIS_TYPE) {
        logger.info("Starting monitoring for " + name + " - " + monitor.name);
        redisStatusMonitor(monitor!, toLower(name));
    }
};

// TODO deleteMonitorTypeHeartbeats
const deleteMonitorTypeHeartbeats = async (monitorId: number, type: string): Promise<void> => {
    let model = null;
    if (type === HTTP_TYPE) {
        model = prisma.httpHeartbeat;
    }
    // if (type === MONGO_TYPE) {
    //     model = prisma.mongoDBHeartbeat;
    // }
    // if (type === REDIS_TYPE) {
    //     model = prisma.redisHeartbeat;
    // }
    // if (type === TCP_TYPE) {
    //     model = TcpModel;
    // }

    if (model !== null) {
        await model.deleteMany({
            where: {
                monitorId
            }
        });
    }
};
