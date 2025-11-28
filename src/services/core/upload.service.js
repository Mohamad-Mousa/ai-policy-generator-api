const multer = require("multer");
const fs = require("fs");
const path = require("path")

class UploadService {

    static defaultOptions = {
        maxSize: 5 * 1024 * 1024 // 5MB in bytes
    }
    static defaultVideoOptions = {
        maxSize: 20 * 1024 * 1024 // 20MB in bytes
    }

    static allowedTypes = ["jpeg", "jpg", "png", "gif", "mp4", "mov", "webm", "avi", "wmv", "flv", "mp3", "wav", "ogg", "aac", "m4a", "wma", "aiff"]

    static multer(folder, options) {
        let multerStorage = this.createMulterStorage("./public/uploads", folder);
        let fileFilter = (req, file, cb) => {
            let ext = path.extname(file.originalname).split(".").pop().toLowerCase();
            if (file && UploadService.allowedTypes.includes(ext)) {
                return cb(null, true);
            }
            return cb(new Error('File format is not supported!'), false);
        }
        let multerOptions = { storage: multerStorage, limits: { fileSize: options.maxSize }, fileFilter };
        return multer(multerOptions);
    }

    static prefixMiddleware() {
        return (req, res, next) => {
            // let prefix = "http://localhost:8080/";
            // if (req.file) {
            //     if (req.file.location) {
            //         req.file.location = prefix + req.file.location;
            //     } else if (req.file.filename) {
            //         req.file.filename = prefix + req.file.filename;
            //     }
            // } else if (req.files) {
            //     for (let i in req.files) {
            //         if (req.files[i].location) {
            //             req.files[i].location = prefix + req.files[i].location;
            //         } else if (req.files[i].filename) {
            //             req.files[i].filename = prefix + req.files[i].filename;
            //         }
            //     }
            // }
            next();
        }
    }

    static createMulterStorage(prefix, folder) {
        let dir = prefix + "/" + folder;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let multerStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, prefix);
            },
            filename: (req, file, cb) => {
                cb(null, `${folder}${+ new Date()}_${file.originalname.replaceAll(' ', '')}`);
            },
        });
        return multerStorage;
    }

    static uploadSingle(file, folder, options = {}) {
        const instanceOptions = Object.assign({}, UploadService.defaultOptions, options);
        return [multer(UploadService.multer(folder, instanceOptions)).single(file),
        UploadService.prefixMiddleware()
        ];
    }

    static uploadArray(file, folder, options = {}) {
        const instanceOptions = Object.assign({}, UploadService.defaultOptions, options);
        return [ multer(UploadService.multer(folder, instanceOptions)).array(file),
            UploadService.prefixMiddleware()
        ];
    }

    static uploadAny(folder, options = {}) {
        const instanceOptions = Object.assign({}, UploadService.defaultOptions, options);
        return [ multer(UploadService.multer(folder, instanceOptions)).any(),
            UploadService.prefixMiddleware()
        ];
    }

    static uploadVideo(file, folder, options = {}) {
        const instanceOptions = Object.assign({}, UploadService.defaultVideoOptions, options);
        return [ multer(UploadService.multer(folder, instanceOptions)).single(file),
            UploadService.prefixMiddleware()
        ];
    }

}

module.exports = UploadService;
