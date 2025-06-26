import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
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
        return res.json({ success: false, message: 'Not Authorized, please login'})
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)

        // Store userId in req object (this won't be overwritten by body parsing)
        req.userId = token_decode.id

        // Also store in a custom property that definitely won't be overwritten
        req.authenticatedUserId = token_decode.id

        // For backward compatibility, also set in body (but this might get overwritten)
        req.body.userId = token_decode.id

        next()

    } catch (error) {
        console.log('Auth middleware - Token verification error:', error.message)
        res.json({success:false, message: error.message})
    }
}

export default authUser;