import { IHeartbeat } from '../interfaces/heartbeat.interface';
import { IMonitorDocument } from '../interfaces/monitor.interface';
import prisma from '../server/database';
import { TcpMonitor } from '../monitors/tcp.monitor';
import { startSingleJob } from '../utils/job';
import { appTimeZone } from '../utils/index';
import dayjs from 'dayjs';

export const createTcpHeartBeat = async (payload: Partial<IHeartbeat>) => {
    console.log(new Date(payload.timestamp!))
    try {
        const result = await prisma.tCPHeartbeat.create({
            // @ts-ignore
            data: {
                ...payload,
                timestamp: new Date(payload.timestamp!)
            }
        });
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

export const getTcpHeartBeatsByDuration = async (monitorId: number, duration = 24): Promise<IHeartbeat[]> => {
    try {
        const dateTime: Date = (dayjs.utc()).toDate();
        dateTime.setHours(dateTime.getHours() - duration);
        console.log("********************************", dateTime);
        const heartbeats: IHeartbeat[] = await prisma.tCPHeartbeat.findMany({
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

export const tcpStatusMonitor = (monitor: IMonitorDocument, name: string): void => {
    const tcpMonitorData: IMonitorDocument = {
        monitorId: monitor.id,
        url: monitor.url,
        port: monitor.port,
        timeout: monitor.timeout
    } as IMonitorDocument;
    startSingleJob(name, appTimeZone, monitor.frequency, async () => TcpMonitor.getInstance().start(tcpMonitorData));
};
