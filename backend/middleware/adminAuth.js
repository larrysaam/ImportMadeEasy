import jwt from 'jsonwebtoken'

const adminAuth = async (req,res,next) => {
    try {
        // Check for token in different header formats
        let token = req.headers.token;

        // If not found, check Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }

        if (!token) {
            return res.json({
                success: false,
                message: "Not authorized. Please login again"
            })
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)

        if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.json({
                success: false,
                message: "Not authorized. Please login again"
            })
        }
        next()
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export default adminAuth