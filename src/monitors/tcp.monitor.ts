import { IMonitorDocument, IMonitorResponse } from '../interfaces/monitor.interface';
import { getMonitorById, updateMonitorStatus } from '../services/monitor.service';
import dayjs from 'dayjs';
import { IHeartbeat } from '../interfaces/heartbeat.interface';
import logger from '../server/logger';
import { createTcpHeartBeat } from '../services/tcp.service';
import { emailSender, locals } from '../utils/common';
import { IEmailLocals } from '../interfaces/notification.interface';
import { tcpPing } from './monitors';

export class TcpMonitor {
    errorCount: number;
    noSuccessAlert: boolean;
    emailsLocals: IEmailLocals;
    static instance: TcpMonitor;

    private constructor() {
        this.errorCount = 0;
        this.noSuccessAlert = true;
        this.emailsLocals = locals();
    }

    async start(data: IMonitorDocument) {
        const { monitorId, url, port, timeout } = data;
        try {
            const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
            this.emailsLocals.appName = monitorData.name;
            const response: IMonitorResponse = await tcpPing(url!, port!, timeout!);
            this.assertionCheck(response, monitorData);
        } catch (error) {
            const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
            this.tcpError(monitorData, error);
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
        const respTime = JSON.parse(monitorData.responseTime!);
        if (monitorData.connection !== response.status || respTime < response.responseTime) {
            this.errorCount += 1;
            heartbeatData = {
                ...heartbeatData,
                status: 1,
                message: 'Failed tcp response assertion',
                code: 500
            };
            await Promise.all([
                updateMonitorStatus(monitorData, timestamp, 'failure'),
                createTcpHeartBeat(heartbeatData)
            ]);
            logger.info(`TCP heartbeat failed assertions: Monitor ID ${monitorData.id}`);
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
                createTcpHeartBeat(heartbeatData)
            ]);
            logger.info(`TCP heartbeat success: Monitor ID ${monitorData.id}`);
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

    async tcpError(monitorData: IMonitorDocument, error: IMonitorResponse) {
        this.errorCount += 1;
        const timestamp = dayjs.utc().valueOf();
        const heartbeatData: Partial<IHeartbeat> = {
            monitorId: monitorData.id!,
            status: 1,
            code: error.code,
            message: error && error.message ? error.message : 'TCP heartbeat failed',
            timestamp,
            responseTime: error.responseTime,
            connection: error.status
        };
        await Promise.all([
            updateMonitorStatus(monitorData, timestamp, 'failure'),
            createTcpHeartBeat(heartbeatData)
        ]);
        logger.info(`TCP heartbeat failed: Monitor ID ${monitorData.id}`);
        if (monitorData.alertThreshold > 0 && this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            // TODO add email
            emailSender(
                monitorData.notifications?.emails!,
                'errorStatus',
                this.emailsLocals
            );
        }
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new TcpMonitor();
        }
        return this.instance;
    }
}
