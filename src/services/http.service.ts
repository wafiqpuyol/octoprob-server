import { IHeartbeat } from "@app/interfaces/heartbeat.interface";
import { IMonitorDocument } from "@app/interfaces/monitor.interface";
import { HttpMonitor } from "@app/monitors/http.monitor";
import prisma from "@app/server/database";
import { appTimeZone } from "@app/utils";
import { startSingleJob } from "@app/utils/job";
import dayjs from "dayjs";

export const createHttpHeartBeat = async (payload: IHeartbeat) => {
    try {
        const result = await prisma.httpHeartbeat.create({
            data: {
                ...payload,
                responseTime: payload.responseTime,
                timestamp: new Date(payload.timestamp!)
            }
        });
        return result;
    } catch (error) {
        console.log("Message error ----------->", error.message);
        throw new Error(error);
    }
};


export const getHttpHeartBeatsByDuration = async (monitorId: number, duration = 24): Promise<IHeartbeat[]> => {
    try {
        const dateTime = (dayjs.utc()).toDate()
        dateTime.setHours(dateTime.getHours() - duration);
        console.log("data ====>", dateTime);
        const heartbeats: IHeartbeat[] = await prisma.httpHeartbeat.findMany({
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

        const heartBeatWithStringTimeStamp = [...heartbeats]
        heartBeatWithStringTimeStamp.map((heartBeat) => {
            heartBeat.timestamp = heartBeat.timestamp.toString() as any
            return heartBeat;
        })
        return heartBeatWithStringTimeStamp;
        return heartbeats;
    } catch (error) {
        console.log("error msg ------->", error);
        throw new Error(error);
    }
};


export const httpStatusMonitor = (monitor: IMonitorDocument, name: string): void => {
    // @ts-ignore
    const httpMonitorData: IMonitorDocument = {
        monitorId: monitor.id,
        httpAuthMethod: monitor.httpAuthMethod,
        basicAuthUser: monitor.basicAuthUser,
        basicAuthPass: monitor.basicAuthPass,
        url: monitor.url,
        method: monitor.method,
        headers: monitor.headers,
        body: monitor.body,
        timeout: monitor.timeout,
        redirects: monitor.redirects,
        bearerToken: monitor.bearerToken
    } as IMonitorDocument;
    // TODO add startSingleJob()
    // startSingleJob(name, appTimeZone, monitor.frequency, async () => console.log(httpMonitorData));
    startSingleJob(name, appTimeZone, monitor.frequency, async () => HttpMonitor.getInstance().start(httpMonitorData));
};
