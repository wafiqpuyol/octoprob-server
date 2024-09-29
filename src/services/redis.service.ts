import { IHeartbeat } from '../interfaces/heartbeat.interface';
import { IMonitorDocument } from '../interfaces/monitor.interface';
import prisma from '../server/database';
import { RedisMonitor } from '../monitors/redis.monitor';
import { startSingleJob } from '../utils/job';
import { appTimeZone } from '../utils/index';
import dayjs from 'dayjs';

export const createRedisHeartBeat = async (payload: Partial<IHeartbeat>) => {
    try {
        const result = await prisma.redisHeartbeat.create({
            // @ts-ignore
            data: {
                ...payload,
                timestamp: new Date(payload.timestamp!)
            }
        });
        return result
    } catch (error) {
        throw new Error(error);
    }
};

export const getRedisHeartBeatsByDuration = async (monitorId: number, duration = 24): Promise<IHeartbeat[]> => {
    try {
        const dateTime: Date = (dayjs.utc()).toDate();
        dateTime.setHours(dateTime.getHours() - duration);
        const heartbeats: IHeartbeat[] = await prisma.redisHeartbeat.findMany({
            where: {
                AND: [
                    { monitorId },
                    {
                        timestamp: {
                            gte: dateTime
                        }
                    }
                ]
            },
            orderBy: {
                timestamp: 'desc'
            }
        }) as unknown as IHeartbeat[];
        return heartbeats;
    } catch (error) {
        throw new Error(error);
    }
};

export const redisStatusMonitor = (monitor: IMonitorDocument, name: string): void => {
    const redisMonitorData: IMonitorDocument = {
        monitorId: monitor.id,
        url: monitor.url
    } as IMonitorDocument;
    startSingleJob(name, appTimeZone, monitor.frequency, async () => RedisMonitor.getInstance().start(redisMonitorData));
};
