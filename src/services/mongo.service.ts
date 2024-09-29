import { IHeartbeat } from '../interfaces/heartbeat.interface';
import { IMonitorDocument } from '../interfaces/monitor.interface';
import prisma from '../server/database';
import { MongoMonitor } from '../monitors/mongo.monitor';
import { startSingleJob } from '../utils/job';
import { appTimeZone } from '../utils/index';
import dayjs from 'dayjs';


export const createMongoHeartBeat = async (payload: Partial<IHeartbeat>) => {
    try {
        const result = await prisma.mongoDBHeartbeat.create({
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

export const getMongoHeartBeatsByDuration = async (monitorId: number, duration = 24) => {
    try {
        const dateTime: Date = (dayjs.utc()).toDate();
        dateTime.setHours(dateTime.getHours() - duration);
        const heartbeats: IHeartbeat[] = await prisma.mongoDBHeartbeat.findMany({

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

export const mongoStatusMonitor = (monitor: IMonitorDocument, name: string): void => {
    const mongoMonitorData: IMonitorDocument = {
        monitorId: monitor.id,
        url: monitor.url
    } as IMonitorDocument;
    startSingleJob(name, appTimeZone, monitor.frequency, async () => MongoMonitor.getInstance().start(mongoMonitorData));
};
