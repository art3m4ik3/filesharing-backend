import multer, { memoryStorage } from "multer";
import { configuration } from "../configuration/configuration";
const storage = memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: configuration.fileOptions.maxSize,
    },
});
const validateFile = upload.single("file");
export default validateFile;
//# sourceMappingURL=validateFile.js.map