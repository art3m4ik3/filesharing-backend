import { Router } from "express";
import uploadController from "../controllers/uploadController";
import validateFile from "../middleware/validateFile";
import { validateToken } from "../middleware/validateToken";
import limiter from "../middleware/rateLimiter";

const router = Router();

router.post("/files", limiter, validateFile, uploadController.uploadFile);

router.get("/files", limiter, uploadController.getAllUploads);

router.get("/files/:id", limiter, uploadController.getUploadById);

router.get("/files/:id/download", limiter, uploadController.downloadFile);

router.patch(
    "/files/:id",
    limiter,
    validateToken,
    uploadController.updateUpload
);

router.delete(
    "/files/:id",
    limiter,
    validateToken,
    uploadController.deleteUpload
);

export default router;
