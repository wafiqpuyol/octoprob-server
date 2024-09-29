import { INotificationDocument } from './notification.interface';

export interface IMonitorDocument {
    id: number;
    monitorId?: number;
    notificationId: number;
    name: string;
    active: boolean;
    status: number | null;
    userId: number;
    frequency: number;
    alertThreshold: number;
    url: string;
    type: string;
    lastChanged: Date | string | null;
    timeout?: number;
    uptime?: number;
    redirects?: number;
    method: string | null;
    headers: string | null;
    body: string | null;
    httpAuthMethod: string | null;
    basicAuthUser: string | null;
    basicAuthPass: string | null;
    bearerToken: string | null;
    contentType: string | null;
    statusCode: string | null;
    responseTime: string | null;
    connection: string | null;
    port: number | null;
    heartbeats?: any[];
    notifications?: INotificationDocument
}

export interface IMonitorResponse {
    status: string;
    responseTime: number;
    message: string;
    code: number;
}

export interface IMonitorArgs {
    monitor: IMonitorDocument;
    monitorId?: string;
    userId?: string;
    name?: string;
    active?: boolean;
    type?: string;
}

