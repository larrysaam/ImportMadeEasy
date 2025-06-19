import nodemailer from 'nodemailer'


const transporter = () => {
  return nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  })
}

export const sendEmail = async (to, subject, text) => {

  try {

    const transport = transporter()

    console.log('Sending email:', { to, subject, text })
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    }

    await transport.sendMail(mailOptions)

  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Email sending failed')
    
  }
}
