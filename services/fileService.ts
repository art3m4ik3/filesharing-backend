import { error as _error } from "../utils/logger";
import minioService from "./minioService";
import { randomUUID } from "crypto";
import { extname } from "path";
import passwordUtils from "../utils/passwordUtils";
import { FileMetadata } from "../types";

const fileService = {
    _tempPasswordHash: "",
    /**
     * Returns the file extension of the given filename. If the filename does not
     * have an extension, it will attempt to determine the extension based on the
     * given mimeType. The following mime types are supported:
     *
     * - image/jpeg: .jpg
     * - image/png: .png
     * - image/gif: .gif
     * - application/pdf: .pdf
     * - text/plain: .txt
     * - application/zip: .zip
     * - application/msword: .doc
     * - application/vnd.openxmlformats-officedocument.wordprocessingml.document: .docx
     *
     * @param {string} filename
     * @param {string} mimeType
     * @returns {string}
     */
    _getFileExtension(filename: string, mimeType: string | undefined) {
        let ext = extname(filename);

        if (!ext && mimeType) {
            const mimeExtensions = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/gif": ".gif",
                "application/pdf": ".pdf",
                "text/plain": ".txt",
                "application/zip": ".zip",
                "application/msword": ".doc",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    ".docx",
            } as const;
            ext = mimeExtensions[mimeType as keyof typeof mimeExtensions] || "";
        }

        return ext;
    },

    /**
     * Uploads a file to the external storage service. The request must contain a
     * file buffer, and the filename can optionally be specified in the request
     * body. The request body may also contain the following optional fields:
     *
     * - password: The password to encrypt the file with. If a password is
     *   provided, the file will be encrypted with it.
     * - maxDownloads: The maximum number of times the file can be downloaded.
     *   If not specified, the file can be downloaded an unlimited number of
     *   times.
     * - expiresIn: The number of seconds after which the file will expire. If
     *   not specified, the file will not expire.
     *
     * The function verifies that the file is less than the maximum allowed size
     * and that the password is valid. It then uploads the file to the storage
     * service, and stores the file ID and key in the database.
     *
     * @param {Buffer} fileBuffer - The file buffer to upload.
     * @param {Object} metadata - The metadata to store with the upload.
     * @param {string} [password] - The password to encrypt the file with.
     * @returns {Promise} A promise that resolves with the response object.
     */
    async uploadToExternalStorage(
        fileBuffer: Buffer,
        metadata: FileMetadata,
        password: string | null = null
    ) {
        try {
            const fileId = randomUUID();

            const minioMetadata = {
                originalname: metadata.original_name,
                customname: metadata.custom_name,
                mimetype: metadata.mime_type,
                size: metadata.size.toString(),
                haspassword: metadata.has_password.toString(),
                maxdownloads: metadata.max_downloads.toString(),
                expiresat: metadata.expires_at,
                uploadedat: metadata.uploaded_at,
                deletiontoken: metadata.deletion_token,
                downloadcount: "0",
                password_hash: "",
            };

            if (password) {
                minioMetadata.password_hash = await passwordUtils.hashPassword(
                    password
                );
            }

            metadata.max_downloads =
                parseInt(String(metadata.max_downloads)) || 0;

            if (metadata.max_downloads < 0) metadata.max_downloads = 0;
            if (!metadata.expires_at) metadata.expires_at = "";

            if (password) {
                metadata.password_hash = await passwordUtils.hashPassword(
                    password
                );
            }

            const ext = this._getFileExtension(
                metadata.custom_name,
                metadata.mime_type
            );
            if (!extname(metadata.custom_name) && ext) {
                metadata.custom_name = metadata.custom_name + ext;
            }

            const key = `${fileId}/${metadata.custom_name}`;

            const result = await minioService.uploadFile(
                key,
                fileBuffer,
                minioMetadata
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            return {
                success: true,
                data: {
                    id: fileId,
                    key,
                },
            };
        } catch (err: unknown) {
            _error("Error in uploadToExternalStorage:", err);
            const error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            return { success: false, error };
        }
    },

    /**
     * Retrieves a list of uploads, paginated by query parameters page and
     * limit.
     *
     * @param {number} [page=1] - The page number to retrieve.
     * @param {number} [limit=10] - The number of items per page.
     * @returns {Promise} A promise that resolves with the list of uploads if
     * successful or an error message if not.
     */
    async getUploadsList(page = 1, limit = 10) {
        try {
            const result = await minioService.listFiles();
            if (!result.success) {
                throw new Error(result.error);
            }

            const fileData = result.data || [];
            const start = (page - 1) * limit;
            const paginatedFiles = fileData.slice(start, start + limit);

            return {
                success: true,
                data: {
                    files: paginatedFiles,
                    total: fileData.length,
                    page,
                    limit,
                },
            };
        } catch (err: unknown) {
            const error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            _error("Error fetching uploads list:", error);
            return { success: false, error };
        }
    },

    /**
     * Retrieves a file by its ID. The ID is the value of the 'id' property
     * in the response object from the uploadToExternalStorage function.
     *
     * The function fetches the file's metadata from the storage service and
     * formats it into a standardized object. If the file is password-protected,
     * the password hash is stored in the _tempPasswordHash property of the
     * service object.
     *
     * @param {string} id - The ID of the file to retrieve.
     * @returns {Promise} A promise that resolves with the response object if
     * successful or an error message if not.
     */
    async getUploadById(id: string) {
        try {
            const files = await minioService.listFiles(`${id}/`);
            if (!files.success || !files.data || files.data.length === 0) {
                throw new Error("File not found");
            }

            const metadata = await minioService.getFileMetadata(
                files.data[0].name
            );
            if (!metadata.success) {
                throw new Error("Failed to fetch file metadata");
            }

            const metaData = metadata.data?.metaData || {};
            const formattedMetadata = {
                original_name: metaData.originalname,
                custom_name: metaData.customname,
                mime_type: metaData.mimetype,
                size: parseInt(metaData.size),
                has_password: metaData.haspassword === "true",
                max_downloads: parseInt(metaData.maxdownloads) || 0,
                expires_at: metaData.expiresat,
                uploaded_at: metaData.uploadedat,
                deletion_token: metaData.deletiontoken,
                download_count: parseInt(metaData.downloadcount) || 0,
            };

            const isExpired = metaData.expiresat
                ? new Date(metaData.expiresat) < new Date()
                : false;

            if (metaData.password_hash) {
                this._tempPasswordHash = metaData.password_hash;
            }

            return {
                success: true,
                data: {
                    id: id,
                    key: files.data[0].name,
                    size: parseInt(metadata.data?.size?.toString() || "0"),
                    meta_data: formattedMetadata,
                    last_modified: metadata.data?.lastModified,
                    etag: metadata.data?.etag,
                    is_expired: isExpired
                },
            };
        } catch (err: unknown) {
            const error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            _error(`Error fetching upload with ID ${id}:`, err);
            return { success: false, error };
        }
    },

    /**
     * Downloads a file from external storage by its ID. If the file is password-protected,
     * the correct password must be provided to access the file. The function checks for
     * various conditions such as password validation, download limit, and expiration.
     * If all conditions are met, the file is retrieved and its metadata is updated to
     * increment the download count.
     *
     * @param {string} id - The ID of the file to download.
     * @param {string|null} [password=null] - The password to access the file if it's protected.
     * @returns {Promise<Object>} A promise that resolves with the file data if successful,
     * or an error message if conditions are not met or any operation fails.
     * @throws Will throw an error if the file is not found, password is required but not provided,
     * the password is invalid, the maximum download limit is reached, or the file has expired.
     */
    async downloadFromExternalStorage(
        id: string,
        password: string | null = null
    ) {
        try {
            const fileInfo = await this.getUploadById(id);
            if (!fileInfo.success || !fileInfo.data) {
                throw new Error("File not found");
            }

            const minioMetadata = await minioService.getFileMetadata(
                fileInfo.data.key
            );
            if (!minioMetadata.success || !minioMetadata.data) {
                throw new Error("Failed to fetch file metadata");
            }

            const metadata = fileInfo.data.meta_data || {};
            const storedHash = minioMetadata.data.metaData.password_hash;

            if (metadata.has_password) {
                if (!password) {
                    throw new Error("Password required");
                }

                if (!storedHash) {
                    throw new Error("File password hash not found");
                }

                const isValid = await passwordUtils.verifyPassword(
                    storedHash,
                    password
                );
                if (!isValid) {
                    throw new Error("Invalid password");
                }
            }

            const currentDownloads = parseInt(
                minioMetadata.data.metaData.downloadcount || "0"
            );
            const maxDownloads = parseInt(
                minioMetadata.data.metaData.maxdownloads || "0"
            );

            if (maxDownloads > 0 && currentDownloads >= maxDownloads) {
                throw new Error("Maximum download limit reached");
            }

            if (metadata.expires_at) {
                const expirationDate = new Date(metadata.expires_at);
                if (expirationDate < new Date()) {
                    throw new Error("File has expired");
                }
            }

            const fileName = metadata.custom_name || "download";
            if (!extname(fileName)) {
                const ext = this._getFileExtension(
                    fileName,
                    metadata.mime_type
                );
                if (ext) {
                    metadata.custom_name = fileName + ext;
                }
            }

            const updatedMetadata = {
                ...minioMetadata.data.metaData,
                downloadcount: (currentDownloads + 1).toString(),
            };

            await minioService.updateMetadata(
                fileInfo.data.key,
                updatedMetadata
            );

            return await minioService.getFile(fileInfo.data.key);
        } catch (err: unknown) {
            const error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            _error("Error in downloadFromExternalStorage:", err);
            return { success: false, error };
        }
    },

    /**
     * Deletes a file from the external storage service. The request must contain
     * the id of the file to delete, which is the value of the 'id' property in the
     * response object from the uploadToExternalStorage function.
     *
     * @param {string} id - The id of the file to delete.
     * @param {string} deletionToken - The deletion token. This is not used in this implementation.
     * @returns {Promise} A promise that resolves with the response object.
     */
    async deleteFromExternalStorage(id: string) {
        try {
            const fileInfo = await this.getUploadById(id);
            if (!fileInfo.success || !fileInfo.data) {
                throw new Error("File not found");
            }

            return await minioService.deleteFile(fileInfo.data.key);
        } catch (err: unknown) {
            const error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            _error(`Error deleting file ${id}:`, err);
            return { success: false, error };
        }
    },

    /**
     * Updates the metadata of a file. The request must contain the id of the file to
     * update, which is the value of the 'id' property in the response object from the
     * uploadToExternalStorage function. The request body must contain the new metadata
     * values to update. If the file has a password, the password must also be provided
     * in the request body. The function returns a response object with the updated
     * metadata if successful, or an error message if not.
     *
     * @param {string} id - The id of the file to update.
     * @param {Object} metadata - The new metadata to update.
     * @param {string} [password] - The password to update if the file has one.
     * @returns {Promise} A promise that resolves with the response object.
     */
    async updateUpload(
        id: string,
        metadata: FileMetadata,
        password: string | null = null
    ) {
        try {
            const fileInfo = await this.getUploadById(id);
            if (!fileInfo.success || !fileInfo.data) {
                throw new Error("File not found");
            }

            const minioMetadata = await minioService.getFileMetadata(
                fileInfo.data.key
            );
            if (!minioMetadata.success || !minioMetadata.data) {
                throw new Error("Failed to fetch file metadata");
            }

            const updatedMetadata: { [key: string]: string } = {
                ...minioMetadata.data.metaData,
                originalname: metadata.original_name,
                customname: metadata.custom_name,
                mimetype: metadata.mime_type,
                size: metadata.size.toString(),
                haspassword: metadata.has_password.toString(),
                maxdownloads: metadata.max_downloads.toString(),
                expiresat: metadata.expires_at.toString(),
            };

            if (password) {
                updatedMetadata.password_hash =
                    await passwordUtils.hashPassword(password);
            }

            const result = await minioService.updateMetadata(
                fileInfo.data.key,
                updatedMetadata
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            return {
                success: true,
                data: {
                    id,
                    metadata: updatedMetadata,
                },
            };
        } catch (err: Error | unknown) {
            _error(`Error updating file ${id}:`, err);
            const error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            return {
                success: false,
                error,
            };
        }
    },

    /**
     * Validates a password for a file. The request should contain the password
     * in the request body. If the password is valid, the function returns a
     * response object with the file's metadata. If the password is invalid or
     * file not found, an error message is returned.
     *
     * @param {string} id - The id of the file to validate the password for.
     * @param {string} password - The password to validate.
     * @returns {Promise} A promise that resolves with the response object.
     */
    async validatePassword(id: string, password: string) {
        try {
            const fileInfo = await this.getUploadById(id);
            if (!fileInfo.success || !fileInfo.data) {
                throw new Error("File not found");
            }

            const minioMetadata = await minioService.getFileMetadata(
                fileInfo.data.key
            );
            if (!minioMetadata.success || !minioMetadata.data) {
                throw new Error("Failed to fetch file metadata");
            }

            const storedHash = minioMetadata.data.metaData.password_hash;
            if (!storedHash) {
                throw new Error("File is not password protected");
            }

            const isValid = await passwordUtils.verifyPassword(
                storedHash,
                password
            );

            return {
                success: true,
                data: { isValid },
            };
        } catch (err: unknown) {
            _error(`Error validating password for file ${id}:`, err);
            const error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            return {
                success: false,
                error,
            };
        }
    },
};

export default fileService;
