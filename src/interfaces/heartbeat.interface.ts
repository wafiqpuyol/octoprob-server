export interface IHeartbeat {
    id: number;
    monitorId: number;
    status: number;
    code: number;
    message: string;
    timestamp: number;
    reqHeaders: string | null;
    resHeaders: string | null;
    reqBody: string | null;
    resBody: string | null;
    responseTime: number;
    connection?: string;
}

export interface IHeartBeatArgs {
    type: string;
    monitorId: string;
    duration: string;
}
