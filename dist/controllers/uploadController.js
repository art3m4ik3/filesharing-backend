import { v4 as uuidv4 } from "uuid";
import fileService from "../services/fileService";
import { generateToken, verifyToken } from "../utils/jwtHelper";
import { success, error } from "../utils/responseHelper";
import { error as _error } from "../utils/logger";
import { extname } from "path";
const uploadController = {
    /**
     * Uploads a file to the server and stores it in the configured external
     * storage service. The request must contain a file, and the filename can
     * optionally be specified in the request body. The request body may also
     * contain the following optional fields:
     *
     * - password: The password to encrypt the file with. If a password is
     *   provided, the file will be encrypted with it.
     * - maxDownloads: The maximum number of times the file can be downloaded.
     *   If not specified, the file can be downloaded an unlimited number of
     *   times.
     * - expiresIn: The number of seconds after which the file will expire. If
     *   not specified, the file will not expire.
     *
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object.
     * @returns {Promise} A promise that resolves with the response object.
     */
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return error(res, 400, "No file uploaded");
            }
            const { filename = req.file.originalname, password } = req.body;
            const maxDownloads = parseInt(req.body.maxDownloads) || 0;
            const expiresIn = parseInt(req.body.expiresIn) || 0;
            const metadata = {
                original_name: req.file.originalname,
                custom_name: filename,
                mime_type: req.file.mimetype,
                size: req.file.size,
                has_password: Boolean(password),
                max_downloads: maxDownloads >= 0 ? maxDownloads : 0,
                expires_in: expiresIn >= 0 ? expiresIn : 0,
                uploaded_at: new Date().toISOString(),
                deletion_token: uuidv4(),
                download_count: 0,
            };
            const uploadResult = await fileService.uploadToExternalStorage(req.file.buffer, metadata, password);
            if (!uploadResult.success || !uploadResult.data) {
                return error(res, 500, "Failed to upload file to storage");
            }
            const token = generateToken({
                file_id: uploadResult.data.id,
                deletion_token: metadata.deletion_token,
            });
            return success(res, 201, {
                id: uploadResult.data.id,
                filename: metadata.custom_name,
                size: metadata.size,
                mime_type: metadata.mime_type,
                url: `/api/files/${uploadResult.data.id}/download`,
                delete_url: `/api/files/${uploadResult.data.id}`,
                delete_token: token,
                expires_at: metadata.expires_in
                    ? new Date(Date.now() + metadata.expires_in * 60 * 60 * 1000).toISOString()
                    : null,
            });
        }
        catch (err) {
            _error("Error in file upload:", err);
            return error(res, 500, "Server error during file upload");
        }
    },
    /**
     * Retrieves a list of uploads, paginated by query parameters page and
     * limit. The request must be authenticated with a valid JWT token.
     *
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object.
     * @returns {Promise} A promise that resolves with the response object,
     * containing the list of uploads if successful or an error message if
     * not.
     */
    async getAllUploads(req, res) {
        try {
            const page = parseInt(String(req.query.page)) || 1;
            const limit = parseInt(String(req.query.limit)) || 10;
            const uploads = await fileService.getUploadsList(page, limit);
            if (!uploads.success) {
                return error(res, 500, "Failed to fetch uploads");
            }
            return success(res, 200, uploads.data);
        }
        catch (err) {
            _error("Error fetching uploads:", err);
            return error(res, 500, "Server error while fetching uploads");
        }
    },
    /**
     * Retrieves an upload by its ID. The request must include the ID as a
     * URL parameter. If the upload is found, its metadata is returned in the
     * response.
     *
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object.
     * @returns {Promise} A promise that resolves with the response object,
     * containing the upload data if found or an error message if not.
     */
    async getUploadById(req, res) {
        try {
            const { id } = req.params;
            const upload = await fileService.getUploadById(id);
            if (!upload.success) {
                return error(res, 404, "Upload not found");
            }
            return success(res, 200, upload.data);
        }
        catch (err) {
            _error(`Error fetching upload ${req.params.id}:`, err);
            return error(res, 500, "Server error while fetching upload");
        }
    },
    /**
     * Downloads a file from the storage service. The request should include
     * the file ID as a URL parameter. Optionally, a password may be provided
     * as a query parameter if the file is password-protected.
     *
     * The function checks if the file exists and verifies that the download
     * conditions are met, including password validation and download limits.
     * If the file is found and conditions are met, it streams the file to
     * the response.
     *
     * Error responses are returned for various failure cases, including
     * file not found, password requirements, download limit reached, and
     * file expiration.
     *
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object.
     * @returns {Promise} A promise that resolves when the file is streamed
     *                    to the response or an error response is sent.
     */
    async downloadFile(req, res) {
        try {
            const { id } = req.params;
            const password = req.query.password
                ? String(req.query.password)
                : undefined;
            const fileInfo = await fileService.getUploadById(id);
            if (!fileInfo.success || !fileInfo.data) {
                return error(res, 404, "File not found");
            }
            const metadata = fileInfo.data?.meta_data || {};
            const fileStream = await fileService.downloadFromExternalStorage(id, password);
            if (!fileStream.success) {
                if (fileStream.error === "Password required") {
                    return error(res, 401, "Password required to download this file");
                }
                if (fileStream.error === "Invalid password") {
                    return error(res, 401, "Invalid password");
                }
                if (fileStream.error === "Maximum download limit reached") {
                    return error(res, 403, "Maximum download limit reached for this file");
                }
                if (fileStream.error === "File has expired") {
                    return error(res, 410, "This file has expired");
                }
                return error(res, 500, "Failed to download file from storage");
            }
            const mimeType = metadata.mime_type || "application/octet-stream";
            let fileName = metadata.custom_name || metadata.original_name;
            if (!extname(fileName) && metadata.mime_type) {
                const ext = fileService._getFileExtension(fileName, metadata.mime_type);
                if (ext) {
                    fileName += ext;
                }
            }
            res.setHeader("Content-Type", mimeType);
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
            if (!fileStream.data) {
                return error(res, 500, "File stream data is missing");
            }
            return fileStream.data.pipe(res);
        }
        catch (err) {
            _error(`Error downloading file ${req.params.id}:`, err);
            return error(res, 500, "Server error during file download");
        }
    },
    /**
     * Updates the metadata of a file. The request must contain an Authorization
     * header with a valid deletion token. The file is only updated if the
     * token is valid and the file is less than 24 hours old.
     *
     * Only the following fields can be updated:
     * - custom_name
     * - max_downloads
     * - expires_in
     * - password
     *
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object.
     * @returns {Promise} A promise that resolves with the response object.
     */
    async updateUpload(req, res) {
        try {
            const { id } = req.params;
            const { filename, password, maxDownloads, expiresIn } = req.body;
            if (!req.headers.authorization) {
                return error(res, 401, "Authorization token required");
            }
            const token = req.headers.authorization.split(" ")[1];
            const decoded = verifyToken(token);
            if (!decoded || decoded.file_id !== id) {
                return error(res, 403, "Invalid or expired token");
            }
            const fileInfo = await fileService.getUploadById(id);
            if (!fileInfo.success || !fileInfo.data) {
                return error(res, 404, "Upload not found");
            }
            const metadata = fileInfo.data.meta_data || {};
            const uploadTime = new Date(metadata.uploaded_at).getTime();
            const timeDiff = (Date.now() - uploadTime) / (1000 * 60 * 60);
            if (timeDiff > 24) {
                return error(res, 403, "Modifications are only allowed within 24 hours of upload");
            }
            const updatedMetadata = {
                ...metadata,
                custom_name: filename || metadata.custom_name,
                has_password: password ? true : false,
                max_downloads: maxDownloads
                    ? parseInt(maxDownloads)
                    : metadata.max_downloads,
                expires_in: expiresIn
                    ? parseInt(expiresIn)
                    : metadata.expires_in,
            };
            const updateResult = await fileService.updateUpload(id, updatedMetadata, password);
            if (!updateResult.success) {
                return error(res, 500, "Failed to update file metadata");
            }
            return success(res, 200, {
                message: "File updated successfully",
                id,
                filename: updatedMetadata.custom_name,
                updated: true,
            });
        }
        catch (err) {
            _error(`Error updating upload ${req.params.id}:`, err);
            return error(res, 500, "Server error while updating file");
        }
    },
    /**
     * Deletes a file from the storage service. The request must contain
     * an Authorization header with a valid deletion token. The token is
     * verified against the deletion token stored with the file, and the
     * file is only deleted if the token is valid and the file is less than
     * 24 hours old.
     *
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object.
     * @returns {Promise} A promise that resolves with the response object.
     */
    async deleteUpload(req, res) {
        try {
            const { id } = req.params;
            if (!req.headers.authorization) {
                return error(res, 401, "Authorization token required");
            }
            const token = req.headers.authorization.split(" ")[1];
            const decoded = verifyToken(token);
            if (!decoded || decoded.file_id !== id) {
                return error(res, 403, "Invalid or expired token");
            }
            const fileInfo = await fileService.getUploadById(id);
            if (!fileInfo.success || !fileInfo.data) {
                return error(res, 404, "Upload not found");
            }
            const uploadTime = new Date(fileInfo.data.meta_data.uploaded_at).getTime();
            const currentTime = new Date().getTime();
            const timeDiff = (currentTime - uploadTime) / (1000 * 60 * 60);
            if (timeDiff > 24) {
                return error(res, 403, "Deletion is only allowed within 24 hours of upload");
            }
            const deleteResult = await fileService.deleteFromExternalStorage(id);
            if (!deleteResult.success) {
                return error(res, 500, "Failed to delete file from storage");
            }
            return success(res, 200, {
                message: "File deleted successfully",
                id,
                deleted: true,
            });
        }
        catch (err) {
            _error(`Error deleting upload ${req.params.id}:`, err);
            return error(res, 500, "Server error while deleting file");
        }
    },
};
export default uploadController;
//# sourceMappingURL=uploadController.js.map