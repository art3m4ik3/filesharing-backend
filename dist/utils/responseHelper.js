/**
 * Sends a success response with the specified HTTP status code and data.
 *
 * @param {Object} res - The Express response object.
 * @param {number} [statusCode=200] - The HTTP status code to send.
 * @param {Object} [data={}] - The data to include in the response body.
 * @returns {Object} The response object with a JSON payload indicating success.
 */
export const success = (res, statusCode = 200, data = {}) => {
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
export const error = (res, statusCode = 500, message = "Internal server error", errors = null) => {
    const response = {
        status: "error",
        code: statusCode,
        message,
    };
    if (errors) {
        response.errors = errors;
    }
    return res.status(statusCode).json(response);
};
//# sourceMappingURL=responseHelper.js.map