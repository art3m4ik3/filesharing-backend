import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';
import { error } from '../utils/responseHelper';

declare module 'express' {
    interface Request {
        user?: unknown;
    }
}

export const validateToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const bearerHeader = req.headers.authorization;

        if (!bearerHeader) {
            error(res, 401, 'No token provided');
            return;
        }

        const bearer = bearerHeader.split(' ');
        const token = bearer[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            error(res, 401, 'Invalid token');
            return;
        }

        req.user = decoded;
        next();
    } catch {
        error(res, 401, 'Token validation failed');
    }
};
