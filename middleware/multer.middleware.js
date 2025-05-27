import multer from "multer";

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."), false);
    }
};

const upload = multer({ storage, fileFilter });

export default upload;