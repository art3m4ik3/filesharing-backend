import { verifyToken } from '../utils/jwtHelper';
import { error } from '../utils/responseHelper';
export const validateToken = (req, res, next) => {
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
    }
    catch {
        error(res, 401, 'Token validation failed');
    }
};
//# sourceMappingURL=validateToken.js.map