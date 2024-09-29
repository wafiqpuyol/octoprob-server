import { IHeartbeat, IHeartBeatArgs } from '../../interfaces/heartbeat.interface';
import { AppContext } from '../../interfaces/app.interface';
import { getHeartbeats } from '../../services/monitor.service';
import { protectedRoute } from '../../guard';

export const HeartbeatResolver = {
    Query: {
        async getHeartbeats(_: undefined, args: IHeartBeatArgs, contextValue: AppContext) {
            const { req } = contextValue;
            protectedRoute(req);
            const { type, monitorId, duration } = args;
            const heartbeats: IHeartbeat[] = await getHeartbeats(type, parseInt(monitorId), parseInt(duration));
            return {
                heartbeats
            };
        }
    },
    HeartBeat: {
        timestamp: (heartbeat: IHeartbeat) => heartbeat.timestamp.toString()
    }
};
