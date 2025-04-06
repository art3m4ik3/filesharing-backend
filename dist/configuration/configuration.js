import { config as _config } from "dotenv";
_config();
export const configuration = {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    },
    corsOptions: {
        origin: process.env.NODE_ENV === "production"
            ? [/\.your-domain\.com$/]
            : "*",
        methods: ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
    },
    fileOptions: {
        maxSize: 100 * 1024 * 1024,
    },
    rateLimit: {
        windowMs: eval(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: process.env.RATE_LIMIT_MAX || 100,
    },
    storage: {
        minio: {
            endPoint: process.env.MINIO_ENDPOINT || "localhost",
            port: parseInt(process.env.MINIO_PORT) || 9000,
            useSSL: process.env.MINIO_USE_SSL === "true",
            accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
            secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
            bucket: process.env.MINIO_BUCKET || "uploads",
        },
    },
    enableCsrf: process.env.NODE_ENV === "production",
};
export default configuration;
//# sourceMappingURL=configuration.js.map