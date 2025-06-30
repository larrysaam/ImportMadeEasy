import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    items: {type: Array, required: true},
    amount: {type: Number, required: true},
    address: {type: Object, required: true},
    status: {type: String, required: true, default: 'Order Placed'},
    paymentMethod: {type: String, required: true},
    payment: {type: Boolean, required: true, default: false},
    date: {type: Number, required: true},
    shipping: {
        method: {type: String, required: true, enum: ['air', 'sea', 'land'], default: 'sea'},
        cost: {type: Number, required: true, default: 0},
        weight: {type: Number, required: true, default: 0},
        country: {type: String, required: true, enum: ['nigeria', 'china'], default: 'china'}
    }
})

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)

export default orderModel