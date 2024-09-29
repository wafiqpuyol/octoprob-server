import { IEmailLocals } from '../interfaces/notification.interface';
import { ISSLInfo, ISSLMonitorDocument } from '../interfaces/ssl.interface';
import { getSSLMonitorById, updateSSLMonitorInfo } from '../services/ssl.service';
import { emailSender, locals } from '../utils/common';
import logger from '../server/logger';

import { getCertificateInfo } from './monitors';

export class SSLMonitor {
    errorCount: number;
    static instance: SSLMonitor;

    constructor() {
        this.errorCount = 0;
    }

    async start(data: ISSLMonitorDocument): Promise<void> {
        const { monitorId, url } = data;
        const emailLocals: IEmailLocals = locals();
        try {
            const monitorData: ISSLMonitorDocument = await getSSLMonitorById(monitorId!);
            emailLocals.appName = monitorData.name;
            const response: ISSLInfo = await getCertificateInfo(url!);
            console.log("fucking response ------->", response);
            console.log("Error happen here -------------------------------------------->", response);
            await updateSSLMonitorInfo(parseInt(`${monitorId}`), JSON.stringify(response));
            logger.info(`SSL certificate for "${url}" is valid`);
        } catch (error) {
            console.log("Error happen here -------------------------------------------->");
            logger.error(`SSL certificate for "${url}" has issues`);
            const monitorData: ISSLMonitorDocument = await getSSLMonitorById(monitorId!);
            this.errorCount += 1;
            await updateSSLMonitorInfo(parseInt(`${monitorId}`), JSON.stringify(error));
            if (monitorData.alertThreshold > 0 && this.errorCount > monitorData.alertThreshold) {
                this.errorCount = 0;
                emailSender(
                    monitorData.notifications!.emails,
                    'errorStatus',
                    emailLocals
                );
            }
        }
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new SSLMonitor();
        }
        return this.instance;
    }
};
