import multer from 'multer';
import AppError from "../utils/AppError.js"
const storage = multer.memoryStorage();

const fileFilter = (req,file,cb)=> {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "text/javascript",
        "text/html",
        "text/css",
        "application/json"
    ];

    if(allowedTypes.includes(file.mimetype)){
        cb(null,true);
    }else{
        cb(new AppError("File type not supported.",400),false);
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits:{fileSize: 10 * 1024 * 1024}, //10MB
})