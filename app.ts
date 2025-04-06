import express, { json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import configuration from "./configuration/configuration";
import uploadRoutes from "./routes/uploadRoutes";
import errorHandler from "./middleware/errorHandler";
import setupSwagger from "./utils/swagger";
import { info, error } from "./utils/logger";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
    cors({
        origin: configuration.corsOptions.origin,
        methods: configuration.corsOptions.methods,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["X-CSRF-Token"],
        maxAge: 86400,
    })
);

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

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
