import { serve, setup } from "swagger-ui-express";
import yaml from "yamljs";
import { join, dirname } from "path";
import { fileURLToPath } from 'url';
import configuration from "../configuration/configuration";
import { Request, Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = yaml.load(join(__dirname, "../docs/api-docs.yaml"));

swaggerDocument.servers = [
    {
        url:
            configuration.env === "production"
                ? "https://your-domain.com/api"
                : `http://localhost:${configuration.port}/api`,
        description:
            configuration.env === "production"
                ? "Production server"
                : "Development server",
    },
];

/**
 * Sets up Swagger UI for API documentation.
 *
 * @param {import("express").Express} app - The Express app.
 *
 * @example
 * const express = require("express");
 * const { setupSwagger } = require("./utils/swagger");
 *
 * const app = express();
 * setupSwagger(app);
 */
interface SwaggerOptions {
    explorer: boolean;
    swaggerOptions: {
        persistAuthorization: boolean;
        displayRequestDuration: boolean;
        filter: boolean;
        tryItOutEnabled: boolean;
        defaultModelsExpandDepth: number;
        defaultModelExpandDepth: number;
    };
}

const setupSwagger = (app: import("express").Express): void => {
    const options: SwaggerOptions = {
        explorer: true,
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            tryItOutEnabled: true,
            defaultModelsExpandDepth: 3,
            defaultModelExpandDepth: 3,
        },
    };

    app.use("/api-docs", serve, setup(swaggerDocument, options));

    app.get("/api-spec.json", (req: Request, res: Response) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerDocument);
    });
};

export default setupSwagger;
