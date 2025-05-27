import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter1 = nodemailer.createTransport({
    service: 'gmail',  // ✅ tells nodemailer to use Gmail's SMTP server
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
})

export const sendOtpMail = async (email, otp) => {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is ${otp}`
    }

    return transporter1.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("error: ", error);
            return res.status(500).json({ message: "Error in sending OTP" });
        }
        else {
            console.log("info: ", info);
            return res.status(200).json({ message: "OTP sent successfully" });
        }
    })
}

