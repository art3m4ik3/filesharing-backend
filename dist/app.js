import express, { json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import configuration from "./configuration/configuration";
import uploadRoutes from "./routes/uploadRoutes";
import errorHandler from "./middleware/errorHandler";
import setupSwagger from "./utils/swagger";
import { info, error } from "./utils/logger";
const app = express();
app.use(helmet());
app.use(cors({
    origin: configuration.corsOptions.origin,
    methods: configuration.corsOptions.methods,
    credentials: true,
    maxAge: 86400,
}));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
if (configuration.enableCsrf) {
    app.use(csurf({
        cookie: {
            httpOnly: true,
            sameSite: "strict",
            secure: configuration.env === "production",
        },
    }));
    app.use((req, res, next) => {
        res.locals.csrfToken = req.csrfToken();
        next();
    });
}
app.use("/api", uploadRoutes);
setupSwagger(app);
app.use(errorHandler);
const PORT = configuration.port || 3000;
app.listen(PORT, () => {
    info(`Server running on port ${PORT} in ${configuration.env} mode`);
});
process.on("unhandledRejection", (err) => {
    error("Unhandled Rejection:", err);
    process.exit(1);
});
export default app;
//# sourceMappingURL=app.js.map