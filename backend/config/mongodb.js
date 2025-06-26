import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('DB connected successfully')
        })

        mongoose.connection.on('error', (err) => {
            console.error('DB connection error:', err)
        })

        mongoose.connection.on('disconnected', () => {
            console.log('DB disconnected')
        })

        const options = {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // 45 seconds
            connectTimeoutMS: 30000, // 30 seconds
            bufferCommands: false,
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            w: 'majority'
        }

        await mongoose.connect(process.env.MONGODB_URI, options)
        console.log('MongoDB connection initiated')

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message)
        // Don't exit the process, let it retry
        setTimeout(connectDB, 5000) // Retry after 5 seconds
    }
}

export default connectDB;