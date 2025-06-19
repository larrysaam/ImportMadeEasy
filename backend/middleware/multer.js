import multer from 'multer'

const storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, String(file.originalname))
    }
})

const upload = multer({storage})

export default upload