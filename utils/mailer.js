import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

if(!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error("GMAIL_USER or GMAIL_PASS is not set in environment variables.");
}



const transporter1 = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
})
console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log("GMAIL_PASS:", process.env.GMAIL_PASS? '******' : 'Not Set');
console.log("Nodemailer Transporter:", transporter1);


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

