import { createLogger, format as _format, transports as _transports, } from "winston";
import configuration from "../configuration/configuration";
const logger = createLogger({
    level: configuration.env === "production" ? "info" : "debug",
    format: _format.combine(_format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
    }), _format.errors({ stack: true }), _format.json()),
    defaultMeta: { service: "anonymous-file-upload" },
    transports: [
        new _transports.Console({
            format: _format.combine(_format.colorize(), _format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
        }),
        ...(configuration.env === "production"
            ? [
                new _transports.File({
                    filename: "logs/error.log",
                    level: "error",
                }),
                new _transports.File({
                    filename: "logs/combined.log",
                }),
            ]
            : []),
    ],
});
export const info = logger.info.bind(logger);
export const error = logger.error.bind(logger);
export default logger;
//# sourceMappingURL=logger.js.map