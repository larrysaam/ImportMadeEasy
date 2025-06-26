import userModel from '../models/userModel.js'
import referralModel from '../models/referralModel.js'
import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const createToken = (id) => {
    return jwt.sign({id},process.env.JWT_SECRET)
}

//route for user login
const loginUser = async (req,res) => {

    try {
        
        const {email, password} = req.body;
        const user = await userModel.findOne({email})

        if (!user) {
            return res.json({
                success: false,
                message: "User doesn't exists"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = createToken(user._id)
            return res.json({
                success: true,
                token
            })
        } else {
            return res.json({
                success: false,
                message: "Invalid credentials"
            })     
        }


    } catch (error) {
        console.log(error)
        res.json({
         success: false,
         message: error.message
        })
    }

}

//route for user register 
const registerUser = async (req,res) => {
    try {

        const { name, email, password, referralCode } = req.body;

        //checking for existing user
        const exists = await userModel.findOne({email})
        if (exists) {
            return res.json({
                success: false, 
                message: 'User already exists'
            })
        }

        //validating email and password

        if (!validator.isEmail(email)) {
            return res.json({
                success: false, 
                message: 'Invalid email'
            })       
        }

        if (password.length < 8) {
            return res.json({
                success: false, 
                message: 'Please enter password with length more then 8 symbols'
            })       
        }

        if (!name) {
            return res.json({
                success: false, 
                message: 'Please enter your name'
            })       
        }

        //hashing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        // Track referral signup if referral code was provided
        if (referralCode) {
            try {
                await referralModel.trackSignup(referralCode, user._id, {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    referrer: req.get('Referer')
                })
            } catch (error) {
                console.error('Error tracking referral signup:', error)
                // Don't fail registration if referral tracking fails
            }
        }

        const token = createToken(user._id)
        res.json({
            success: true,
            token
        })

    } catch (error) {
       console.log(error)
       res.json({
        success: false,
        message: error.message
       })
    }

}

//route for admin login
const adminLogin = async (req,res) => {
    try {
        const { email, password } = req.body

        if ((email === process.env.ADMIN_EMAIL) && 
        (password === process.env.ADMIN_PASSWORD)) {
            const token = jwt.sign(email+password, process.env.JWT_SECRET)
            res.json({
                success:true,
                token
            })
        } else {
            res.json({
                success: false,
                message: "Invalid credentials"
            })
        }
    } catch (error) {
        console.log(error)
        res.json({
         success: false,
         message: error.message
        })
    }
}

export { loginUser, registerUser, adminLogin }