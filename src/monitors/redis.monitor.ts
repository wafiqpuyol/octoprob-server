import { IMonitorDocument, IMonitorResponse } from '../interfaces/monitor.interface';
import { getMonitorById, updateMonitorStatus } from '../services/monitor.service'
import dayjs from 'dayjs';
import { IHeartbeat } from '../interfaces/heartbeat.interface';
import { createRedisHeartBeat } from '../services/redis.service';
import logger from '../server/logger';
import { IEmailLocals } from '../interfaces/notification.interface';
import { emailSender, locals } from '../utils/common';
import { redisPing } from './monitors';

export class RedisMonitor {
    errorCount: number;
    noSuccessAlert: boolean;
    emailsLocals: IEmailLocals;
    static instance: RedisMonitor

    private constructor() {
        this.errorCount = 0;
        this.noSuccessAlert = true;
        this.emailsLocals = locals();
    }

    async start(data: IMonitorDocument) {
        const { monitorId, url } = data;
        try {
            const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
            this.emailsLocals.appName = monitorData.name;
            const response: IMonitorResponse = await redisPing(url!);
            this.assertionCheck(response, monitorData);
        } catch (error) {
            const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
            this.redisError(monitorData, error);
        }
    }

    async assertionCheck(response: IMonitorResponse, monitorData: IMonitorDocument) {
        const timestamp = dayjs.utc().valueOf();
        let heartbeatData: Partial<IHeartbeat> = {
            monitorId: monitorData.id!,
            status: 0,
            code: response.code,
            message: response.message,
            timestamp,
            responseTime: response.responseTime,
            connection: response.status
        };
        if (monitorData.connection !== response.status) {
            this.errorCount += 1;
            heartbeatData = {
                ...heartbeatData,
                status: 1,
                message: 'Failed redis response assertion',
                code: 500
            };
            await Promise.all([
                updateMonitorStatus(monitorData, timestamp, 'failure'),
                createRedisHeartBeat(heartbeatData)
            ]);
            logger.info(`Redis heartbeat failed assertions: Monitor ID ${monitorData.id}`);
            if (monitorData.alertThreshold > 0 && this.errorCount > monitorData.alertThreshold) {
                this.errorCount = 0;
                this.noSuccessAlert = false;
                // TODO add email
                emailSender(
                    monitorData.notifications!.emails,
                    'errorStatus',
                    this.emailsLocals
                );
            }
        } else {
            await Promise.all([
                updateMonitorStatus(monitorData, timestamp, 'success'),
                createRedisHeartBeat(heartbeatData)
            ]);
            logger.info(`Redis heartbeat success: Monitor ID ${monitorData.id}`);
            if (!this.noSuccessAlert) {
                this.errorCount = 0;
                this.noSuccessAlert = true;
                // TODO add email
                emailSender(
                    monitorData.notifications!.emails,
                    'successStatus',
                    this.emailsLocals
                );
            }
        }
    }

    async redisError(monitorData: IMonitorDocument, error: IMonitorResponse) {
        this.errorCount += 1;
        const timestamp = dayjs.utc().valueOf();
        const heartbeatData: Partial<IHeartbeat> = {
            monitorId: monitorData.id!,
            status: 1,
            code: error.code,
            message: error && error.message ? error.message : 'Redis heartbeat failed',
            timestamp,
            responseTime: error.responseTime,
            connection: error.status
        };
        await Promise.all([
            updateMonitorStatus(monitorData, timestamp, 'failure'),
            createRedisHeartBeat(heartbeatData)
        ]);
        logger.info(`Redis heartbeat failed: Monitor ID ${monitorData.id}`);
        if (monitorData.alertThreshold > 0 && this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            // TODO add email
            emailSender(
                monitorData.notifications!.emails,
                'errorStatus',
                this.emailsLocals
            );
        }
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new RedisMonitor();
        }
        return this.instance;
    }
}
