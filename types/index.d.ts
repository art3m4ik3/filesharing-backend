import { Request } from "express";

export interface CustomRequest extends Request {
    file?: Express.Multer.File;
}

export interface FileMetadata {
    original_name: string;
    custom_name: string;
    mime_type: string;
    size: number;
    has_password: boolean;
    max_downloads: number;
    expires_at: string;
    uploaded_at: string;
    deletion_token: string;
    download_count: number;
    password_hash?: string;
}

export interface UploadResult {
    success: boolean;
    data?: {
        id: string;
        key: string;
        metadata?: FileMetadata;
    };
    error?: string;
}

export interface CustomError extends Error {
    code?: string;
    statusCode?: number;
}
