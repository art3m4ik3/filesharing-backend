import { Client } from "minio";
import configuration from "../configuration/configuration";
import logger from "../utils/logger";
import { Readable } from "stream";

const minioClient = new Client({
    endPoint: configuration.storage.minio.endPoint,
    port: configuration.storage.minio.port,
    useSSL: configuration.storage.minio.useSSL,
    accessKey: configuration.storage.minio.accessKey,
    secretKey: configuration.storage.minio.secretKey,
});

const minioService = {
    /**
     * Uploads a file to the MinIO storage service.
     *
     * @param {string} key - The unique identifier for the file in the storage.
     * @param {Buffer} buffer - The file data to be uploaded.
     * @param {Object} metadata - The metadata to associate with the file.
     * @returns {Promise<Object>} A promise that resolves with a success status.
     *                            If an error occurs, the promise resolves with
     *                            an error message.
     */
    async uploadFile(
        key: string,
        buffer: string | Readable | Buffer,
        metadata: Record<string, string>
    ) {
        try {
            await minioClient.putObject(
                configuration.storage.minio.bucket,
                key,
                buffer,
                undefined,
                metadata
            );
            return { success: true };
        } catch (error: unknown) {
            logger.error("MinIO upload error:", error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    },

    /**
     * Downloads a file from the MinIO storage service.
     *
     * @param {string} key - The unique identifier for the file in the storage.
     * @returns {Promise<Object>} A promise that resolves with the file data if
     *                            successful. If an error occurs, the promise
     *                            resolves with an error message.
     */
    async getFile(key: string) {
        try {
            const stream = await minioClient.getObject(
                configuration.storage.minio.bucket,
                key
            );
            return { success: true, data: stream };
        } catch (err: unknown) {
            logger.error("MinIO download error:", err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    },

    /**
     * Deletes a file from the MinIO storage service.
     *
     * @param {string} key - The unique identifier for the file in the storage.
     * @returns {Promise<Object>} A promise that resolves with a success status.
     *                            If an error occurs, the promise resolves with
     *                            an error message.
     */
    async deleteFile(key: string) {
        try {
            await minioClient.removeObject(
                configuration.storage.minio.bucket,
                key
            );
            return { success: true };
        } catch (err: unknown) {
            logger.error("MinIO delete error:", err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    },

    /**
     * Lists all files in the MinIO storage service. The list is filtered by
     * the specified prefix, which may be an empty string to list all files.
     *
     * @param {string} [prefix=""] - The prefix to use when listing objects.
     * @returns {Promise<Object>} A promise that resolves with an array of file
     *                            metadata if successful. If an error occurs, the
     *                            promise resolves with an error message.
     */
    async listFiles(prefix = "") {
        try {
            const stream = minioClient.listObjects(
                configuration.storage.minio.bucket,
                prefix,
                true
            );
            const files = [];

            for await (const file of stream) {
                files.push(file);
            }

            return { success: true, data: files };
        } catch (err: unknown) {
            logger.error("MinIO list error:", err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    },

    /**
     * Retrieves the metadata of a file from the MinIO storage service.
     *
     * @param {string} key - The unique identifier for the file in the storage.
     * @returns {Promise<Object>} A promise that resolves with the file metadata
     *                            if successful. If an error occurs, the promise
     *                            resolves with an error message.
     */
    async getFileMetadata(key: string) {
        try {
            const stat = await minioClient.statObject(
                configuration.storage.minio.bucket,
                key
            );
            return { success: true, data: stat };
        } catch (err: unknown) {
            logger.error("MinIO stat error:", err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    },

    /**
     * Updates the metadata of a file in the MinIO storage service. The request
     * must contain the key of the file to update, and the new metadata to
     * associate with the file.
     *
     * @param {string} key - The unique identifier for the file in the storage.
     * @param {Object} metadata - The new metadata to associate with the file.
     * @returns {Promise<Object>} A promise that resolves with a success status
     *                            if successful. If an error occurs, the promise
     *                            resolves with an error message.
     */
    async updateMetadata(key: string, metadata: Record<string, string>) {
        try {
            const stat = await minioClient.statObject(
                configuration.storage.minio.bucket,
                key
            );
            const objectData = await minioClient.getObject(
                configuration.storage.minio.bucket,
                key
            );
            await minioClient.putObject(
                configuration.storage.minio.bucket,
                key,
                objectData,
                stat.size,
                metadata
            );
            return { success: true };
        } catch (err: unknown) {
            logger.error("MinIO metadata update error:", err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    },
};

export default minioService;
