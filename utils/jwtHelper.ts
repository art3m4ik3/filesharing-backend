import jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import { configuration } from "../configuration/configuration";
import logger from "./logger";

interface JWTPayload {
    file_id: string;
    deletion_token: string;
}

export const generateToken = (payload: JWTPayload): string => {
    if (!configuration.jwt.secret) {
        throw new Error("JWT secret is not defined");
    }

    const secretBuffer = Buffer.from(configuration.jwt.secret, "utf8");

    const options: SignOptions = {
        expiresIn: configuration.jwt
            .expiresIn as jwt.SignOptions["expiresIn"],
    };

    try {
        return jwt.sign(payload, secretBuffer, options);
    } catch (error) {
        console.error("Error generating JWT token:", error);
        throw new Error("Failed to generate token");
    }
};

export const verifyToken = (token: string): JWTPayload | null => {
    try {
        if (!configuration.jwt.secret) {
            throw new Error("JWT secret is not defined");
        }
        const decoded = jwt.verify(
            token,
            configuration.jwt.secret
        ) as unknown;
        const payload = decoded as JWTPayload;
        if (
            typeof payload.file_id === "string" &&
            typeof payload.deletion_token === "string"
        ) {
            return payload;
        }
        return null;
    } catch (err: unknown) {
        logger.error("JWT verification error:", err);
        return null;
    }
};
