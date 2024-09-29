import { IEmailLocals } from "@app/interfaces/notification.interface";
import { locals } from "@app/utils/common"
import { IMonitorDocument } from "../interfaces/monitor.interface"
import { IHeartbeat } from "../interfaces/heartbeat.interface"
import { updateMonitorStatus, getMonitorById } from "../services/monitor.service"
import { createHttpHeartBeat } from "../services/http.service"
import { encodeBase64, emailSender } from "../utils/common"
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import logger from "../server/logger"


export class HttpMonitor {
    errorCount: number;
    noSuccessAlert: boolean;
    emailsLocals: IEmailLocals;
    static instance: HttpMonitor;

    private constructor() {
        this.errorCount = 0
        this.noSuccessAlert = true
        this.emailsLocals = locals()
    }

    async start(data: IMonitorDocument): Promise<void> {
        console.log("-----------------------Enter into start-------------------");
        // @ts-ignore
        const {
            monitorId,
            httpAuthMethod,
            basicAuthUser,
            basicAuthPass,
            url,
            method,
            headers,
            body,
            timeout,
            redirects,
            bearerToken
        } = data;
        const reqTimeout = timeout! * 1000;
        const startTime: number = Date.now();
        try {
            const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
            console.log("Monitor data ---------->", monitorData);
            this.emailsLocals.appName = monitorData.name;
            let basicAuthHeader = {};
            if (httpAuthMethod === 'basic') {
                basicAuthHeader = {
                    Authorization: `Basic ${encodeBase64(basicAuthUser!, basicAuthPass!)}`
                };
            }
            if (httpAuthMethod === 'token') {
                basicAuthHeader = {
                    Authorization: `Bearer ${bearerToken}`
                };
            }

            let bodyValue = null;
            let reqContentType = null;
            if (body && body.length > 0) {
                try {
                    bodyValue = JSON.parse(body!);
                    reqContentType = 'application/json';
                } catch (error) {
                    throw new Error('Your JSON body is invalid');
                }
            }

            const options: AxiosRequestConfig = {
                url,
                method: (method || 'get').toLowerCase(),
                timeout: reqTimeout,
                headers: {
                    Accept: 'text/html,application/json',
                    ...(reqContentType ? { 'Content-Type': reqContentType } : {}),
                    ...basicAuthHeader,
                    ...(headers ? JSON.parse(headers) : {})
                },
                maxRedirects: redirects,
                ...(bodyValue && {
                    data: bodyValue
                })
            };
            // console.log("optoins ----------->", options);
            const response: AxiosResponse = await axios.request(options);
            const responseTime = Date.now() - startTime;
            // @ts-ignore
            let heartbeatData: IHeartbeat = {
                monitorId: monitorId!,
                status: 0,
                code: response.status ?? 0,
                message: `${response.status} - ${response.statusText}` ?? 'Http monitor check successful.',
                timestamp: dayjs.utc().valueOf(),
                reqHeaders: JSON.stringify(response.headers) ?? '',
                resHeaders: JSON.stringify(response.request.res.rawHeaders) ?? '',
                reqBody: body,
                resBody: JSON.stringify(response.data) ?? '',
                responseTime
            };
            const statusList = JSON.parse(monitorData.statusCode!);
            console.log("statusList ----------->", statusList, statusList.includes(response.status));
            const responseDurationTime = JSON.parse(monitorData.responseTime!);
            console.log("Response time ----------->", responseDurationTime < responseTime);
            console.log("length _________>", monitorData.contentType);
            const contentTypeList = monitorData.contentType!.length > 0 ? JSON.parse(JSON.stringify(monitorData.contentType!)) : [];
            console.log("Content type ----------->", contentTypeList, contentTypeList);
            if (
                !statusList.includes(response.status) ||
                responseDurationTime < responseTime ||
                (contentTypeList.length > 0 && !contentTypeList.includes(response.headers['content-type']))
            ) {
                heartbeatData = {
                    ...heartbeatData,
                    status: 1,
                    message: 'Failed http response assertion',
                    code: 500
                };
                console.log("---------------didn't match--------------------");
                console.log(response.headers['content-type']);
                console.log(contentTypeList, contentTypeList.includes(response.headers['content-type']));
                this.errorAssertionCheck(monitorData, heartbeatData);
            } else {
                this.successAssertionCheck(monitorData, heartbeatData);
            }
        } catch (error) {
            console.log("error msg ----->", error);
            const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
            this.httpError(monitorId!, startTime, monitorData, error);
        }
    }

    async errorAssertionCheck(monitorData: IMonitorDocument, heartbeatData: IHeartbeat): Promise<void> {
        console.log("--------------Error ---------------------");
        this.errorCount += 1;
        const timestamp = dayjs.utc().valueOf();
        await Promise.all([updateMonitorStatus(monitorData, timestamp, 'failure'), createHttpHeartBeat(heartbeatData)]);
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
        logger.info(`HTTP heartbeat failed assertions: Monitor ID ${monitorData.id}`);
    }

    async successAssertionCheck(monitorData: IMonitorDocument, heartbeatData: IHeartbeat): Promise<void> {
        console.log("-------------- Success ---------------------");
        await Promise.all([
            updateMonitorStatus(monitorData, heartbeatData.timestamp, 'success'),
            createHttpHeartBeat(heartbeatData)
        ]);
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
        logger.info(`HTTP heartbeat success: Monitor ID ${monitorData.id}`);
    }

    async httpError(monitorId: number, startTime: number, monitorData: IMonitorDocument, error: any): Promise<void> {
        console.log("--------------Error ---------------------");
        logger.info(`HTTP heartbeat failed: Monitor ID ${monitorData.id}`);
        this.errorCount += 1;
        const timestamp = dayjs.utc().valueOf();
        // @ts-ignore
        const heartbeatData: IHeartbeat = {
            monitorId: monitorId!,
            status: 1,
            code: error.response ? error.response.status : 500,
            message: error.response ? `${error.response.status} - ${error.response.statusText}` : 'Http monitor error',
            timestamp,
            reqHeaders: error.response ? JSON.stringify(error.response.headers) : '',
            resHeaders: error.response ? JSON.stringify(error.response.request.res.rawHeaders) : '',
            reqBody: '',
            resBody: error.response ? JSON.stringify(error.response.data) : '',
            responseTime: Date.now() - startTime
        };
        await Promise.all([updateMonitorStatus(monitorData, timestamp, 'failure'), createHttpHeartBeat(heartbeatData)]);
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
            this.instance = new HttpMonitor();
        }
        return this.instance;
    }
}