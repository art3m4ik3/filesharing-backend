import { Response } from "express";

interface ErrorResponse {
    status: string;
    code: number;
    message: string;
    errors?: string[];
}

/**
 * Sends a success response with the specified HTTP status code and data.
 *
 * @param {Object} res - The Express response object.
 * @param {number} [statusCode=200] - The HTTP status code to send.
 * @param {Object} [data={}] - The data to include in the response body.
 * @returns {Object} The response object with a JSON payload indicating success.
 */

export const success = (
    res: Response,
    statusCode: number = 200,
    data: unknown = {}
): Response => {
    return res.status(statusCode).json({
        status: "success",
        code: statusCode,
        data,
    });
};

/**
 * Sends an error response with the specified HTTP status code, message, and optional
 * error details.
 *
 * @param {Object} res - The Express response object.
 * @param {number} [statusCode=500] - The HTTP status code to send.
 * @param {string} [message="Internal Server Error"] - The error message to include
 *   in the response body.
 * @param {Object} [errors=null] - Optional error details to include in the response
 *   body.
 * @returns {Object} The response object with a JSON payload indicating an error.
 */
export const error = (
    res: Response,
    statusCode: number = 500,
    message: string = "Internal server error",
    errors: string[] | null = null
): Response => {
    const response: ErrorResponse = {
        status: "error",
        code: statusCode,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};
