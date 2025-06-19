import nodemailer from 'nodemailer'
import Setting from '../models/settingModel.js'

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  })
}

export const sendOrderNotification = async (orderDetails, isPreorder = false) => {
  try {
    const settings = await Setting.findOne()
    const adminEmail = settings?.email?.notifications

    if (!adminEmail) {
      console.error('Admin email not configured in settings')
      return
    }

    const transporter = createTransporter()

    const orderType = isPreorder ? 'Pre-order' : 'Order'
    const items = orderDetails.items.map(item => 
      `- ${item.name} (Size: ${item.size}, Quantity: ${item.quantity})`
    ).join('\n')

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New ${orderType} Received`,
      text: `
        New ${orderType} Details:
        
        Order ID: ${orderDetails._id}
        Customer: ${orderDetails.address.firstName} ${orderDetails.address.lastName}
        Email: ${orderDetails.address.email}
        Phone: ${orderDetails.address.phone}
        
        Items:
        ${items}
        
        Total Amount: $${orderDetails.amount}
        
        Shipping Address:
        ${orderDetails.address.street}
        ${orderDetails.address.city}, ${orderDetails.address.state} ${orderDetails.address.zipCode}
        ${orderDetails.address.country}
      `
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Email notification error:', error)
  }
}