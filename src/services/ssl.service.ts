import { getSingleNotificationGroup } from '../services/notification.service';
import { ISSLMonitorDocument } from '../interfaces/ssl.interface';
import prisma from '../server/database';
import { startSingleJob } from '../utils/job';
import { appTimeZone } from '../utils/index';
import { SSLMonitor } from '../monitors/ssl.monitor';


export const createSSLMonitor = async (payload: ISSLMonitorDocument) => {
    try {
        const result = await prisma.sSLMonitor.create({ data: payload });
        return result
    } catch (error) {
        throw new Error(error);
    }
};

export const getUserSSLMonitors = async (userId: number, active?: boolean): Promise<ISSLMonitorDocument[]> => {
    try {
        const monitors: ISSLMonitorDocument[] = (await prisma.sSLMonitor.findMany({
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
            }
        })) as unknown as ISSLMonitorDocument[];
        return monitors;
    } catch (error) {
        throw new Error(error);
    }
};


export const getUserActiveSSLMonitors = async (userId: number): Promise<ISSLMonitorDocument[]> => {
    try {
        const monitors: ISSLMonitorDocument[] = await getUserSSLMonitors(userId, true);
        return monitors;
    } catch (error) {
        throw new Error(error);
    }
};


export const getAllUsersActiveSSLMonitors = async (): Promise<ISSLMonitorDocument[]> => {
    try {
        const monitors: ISSLMonitorDocument[] = await prisma.sSLMonitor.findMany({
            where: { active: true },
            orderBy: {
                createdAt: 'desc'
            }
        }) as unknown as ISSLMonitorDocument[];
        return monitors;
    } catch (error) {
        throw new Error(error);
    }
};


export const getSSLMonitorById = async (monitorId: number) => {
    try {
        const monitor: ISSLMonitorDocument = await prisma.sSLMonitor.findFirst({
            where: { id: monitorId }
        }) as unknown as ISSLMonitorDocument;
        let updatedMonitor: ISSLMonitorDocument = { ...monitor };
        const notifications = await getSingleNotificationGroup(updatedMonitor.notificationId!);
        updatedMonitor = { ...updatedMonitor, notifications };
        return updatedMonitor;
    } catch (error) {
        throw new Error(error);
    }
};

// TODO this query can break as we didn't use [AND] condition
export const toggleSSLMonitor = async (monitorId: number, userId: number, active: boolean): Promise<ISSLMonitorDocument[]> => {
    try {
        await prisma.sSLMonitor.update({
            where: { id: monitorId, userId },
            data: { active }
        })
        const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

export const updateSingleSSLMonitor = async (monitorId: number, userId: number, data: ISSLMonitorDocument): Promise<ISSLMonitorDocument[]> => {
    try {
        await prisma.sSLMonitor.update({
            where: { id: monitorId },
            data
        });
        const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};


export const updateSSLMonitorInfo = async (monitorId: number, infoData: string): Promise<void> => {
    try {
        await prisma.sSLMonitor.update({
            where: { id: monitorId },
            data: { info: infoData }
        }
        );
    } catch (error) {
        throw new Error(error);
    }
};


export const deleteSingleSSLMonitor = async (monitorId: number, userId: number): Promise<ISSLMonitorDocument[]> => {
    try {
        await prisma.sSLMonitor.delete({
            where: { id: monitorId }
        });
        const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};


export const sslStatusMonitor = (monitor: ISSLMonitorDocument, name: string): void => {
    const sslData: ISSLMonitorDocument = {
        monitorId: monitor.id,
        url: monitor.url
    } as ISSLMonitorDocument;
    startSingleJob(name, appTimeZone, monitor.frequency, async () => SSLMonitor.getInstance().start(sslData));
};
