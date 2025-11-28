const UploadService = require("../services/core/upload.service");

class UploadMiddleware {

    static uploadSingle(file, folder) {
        return UploadService.uploadSingle(file, folder);
    }

    static uploadArray(file, folder) {
        return UploadService.uploadArray(file, folder);
    }

    static uploadAny(folder) {
        return UploadService.uploadAny(folder);
    }

    static uploadVideo(file, folder) {
        return UploadService.uploadVideo(file, folder);
    }
}

module.exports = UploadMiddleware;