import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    cartData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    deliveryInfo: {
        firstName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipcode: { type: String, default: '' },
        country: { type: String, default: 'Cameroon' }
    },
    date: { type: Date, default: Date.now }
}, {
    minimize: false,
    timestamps: true
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel