import rateLimit from "express-rate-limit";
import configuration from "../configuration/configuration";
const limiter = rateLimit({
    windowMs: configuration.rateLimit.windowMs,
    max: Number(configuration.rateLimit.max),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        code: 429,
        message: "Too many requests, please try again later.",
    },
});
export default limiter;
//# sourceMappingURL=rateLimiter.js.map