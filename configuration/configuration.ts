import { config as _config } from "dotenv";
_config();

export const configuration = {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_expires_at || "24h",
    },

    corsOptions: {
        origin:
            process.env.NODE_ENV === "production"
                ? [/\.your-domain\.com$/]
                : ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization',],
        exposedHeaders: ['X-CSRF-Token']
    },

    fileOptions: {
        maxSize: 100 * 1024 * 1024,
    },

    rateLimit: {
        windowMs: eval(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000,
        max: process.env.RATE_LIMIT_MAX || 100,
    },

    storage: {
        minio: {
            endPoint: process.env.MINIO_ENDPOINT || "localhost",
            port: parseInt(process.env.MINIO_PORT!) || 9000,
            useSSL: process.env.MINIO_USE_SSL === "true",
            accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
            secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
            bucket: process.env.MINIO_BUCKET || "uploads",
        },
    },
};

export default configuration;
