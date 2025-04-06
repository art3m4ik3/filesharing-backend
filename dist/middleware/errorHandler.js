/* eslint-disable @typescript-eslint/no-unused-vars */
import { error } from "../utils/responseHelper";
import { error as _error } from "../utils/logger";
const errorHandler = (err, _req, res, _next) => {
    _error("Error:", err);
    if (err.code === "EBADCSRFTOKEN") {
        return error(res, 403, "Invalid CSRF token. Form tampered with.");
    }
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            return error(res, 413, "File too large");
        }
        return error(res, 400, `File upload error: ${err.message}`);
    }
    if (err.name === "JsonWebTokenError") {
        return error(res, 401, "Invalid token");
    }
    if (err.name === "TokenExpiredError") {
        return error(res, 401, "Token expired");
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return error(res, statusCode, message);
};
export default errorHandler;
//# sourceMappingURL=errorHandler.js.map