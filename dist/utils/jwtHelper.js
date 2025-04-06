import jwt from "jsonwebtoken";
import { configuration } from "../configuration/configuration";
import logger from "./logger";
export const generateToken = (payload) => {
    if (!configuration.jwt.secret) {
        throw new Error("JWT secret is not defined");
    }
    const secretBuffer = Buffer.from(configuration.jwt.secret, "utf8");
    const options = {
        expiresIn: configuration.jwt
            .expiresIn,
    };
    try {
        return jwt.sign(payload, secretBuffer, options);
    }
    catch (error) {
        console.error("Error generating JWT token:", error);
        throw new Error("Failed to generate token");
    }
};
export const verifyToken = (token) => {
    try {
        if (!configuration.jwt.secret) {
            throw new Error("JWT secret is not defined");
        }
        const decoded = jwt.verify(token, configuration.jwt.secret);
        const payload = decoded;
        if (typeof payload.file_id === "string" &&
            typeof payload.deletion_token === "string") {
            return payload;
        }
        return null;
    }
    catch (err) {
        logger.error("JWT verification error:", err);
        return null;
    }
};
//# sourceMappingURL=jwtHelper.js.map