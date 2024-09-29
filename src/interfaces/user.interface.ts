import { INotificationDocument } from './notification.interface';

declare global {
    namespace Express {
        interface Request {
            currentUser?: IAuthPayload;
        }
    }
}

export interface IAuthPayload {
    id: number;
    username: string;
    email: string;
    iat?: number;
    createdAt: String
}

export interface IUserDocument {
    id?: number;
    username: string;
    googleId?: string;
    facebookId?: string;
    email: string;
    password?: string;
    createdAt?: Date;
    type?: "facebook" | "google";
}

export interface IUserResponse {
    user: IUserDocument;
    notifications: INotificationDocument[];
}