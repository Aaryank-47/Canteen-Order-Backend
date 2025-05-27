import user from "../models/authModels.js"
import bcrypt from "bcryptjs";
import {generateToken} from "../utils/jwt.js";
import { sendOtpMail } from "../utils/mailer.js"
import generateotp from "../utils/otpGenerator.js";
import { OAuth2Client } from "google-auth-library"

export const signup = async (req, res) => {
    try {
        const { name, contact, college, email, password } = req.body;

        if (!name || !contact || !college || !email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        const userExists = await user.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "user already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt)


        try {
            const userCreated = await user.create({
                name,
                contact,
                college,
                email,
                password: hashPassword
            });
            
            if (!profileCreated) {
                return res.status(400).json({ message: "Profile not created" });
            }   

            const token = await generateToken(userCreated);

            res.cookie("userToken", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                secure: false,
                sameSite: "none"
            }).status(201).json({
                message: "user created successfully",
                userId: userCreated._id.toString(),
                token: generateToken(userCreated)
            })
            console.log("token:", token);
            console.log("cookies:", req.cookies.token);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error });
        }

    } catch (error) {
        res.status(500).json({ "internal server error1": error })
    }
}



export const login = async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "please fill all the required fields" });
        }

        const userExists = await user.findOne({ email });
        if (!userExists) {
            return res.status(400).json({ message: "User does not exist" });
        }

        const userPasswordMatch = await bcrypt.compare(password, userExists.password);
        if (!userPasswordMatch) {
            return res.status(401).json({ message: "wrong password buddy" });
        }

        const token = await generateToken(userExists)
        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            secure: false,
            sameSite: "none"
        }).status(200).json({ 
            message: "login successfully", 
            userId: userExists._id.toString(), 
            token: token 
        });
        console.log(token)
        //show cookie in console
        console.log("cookies:", req.cookies.token);
    } catch (error) {
        res.status(500).json({ 'internal server error2': error })
    }

}


export const logout = async (req, res) => {
    try {
        // res.cookie("token", null, {
        //     httpOnly: true,
        //     expires: new Date(Date.now()),
        //     secure: false,
        //     sameSite: "none"
        // }).status(200).json({message:"logged out null successfully", token: null})
        res.clearCookie("token");
        res.status(200).json({ message: "logged out clear successfully", token: null });
    }
    catch (error) {
        res.status(500).json({ 'internal server error3': error })
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const userExists = await user.findOne({ email });

        if (!email) {
            return res.status(400).json({ message: "please fill all the required fields" });
        }

        if (!userExists) {
            return res.status(400).json({ message: "User does not exists with this email" });
        }

        const otp = generateotp();
        const expiresIn = new Date(Date.now() + 2 * 60 * 1000);
        console.log("otp:", otp);

        userExists.otp = otp;
        userExists.expiresIn = expiresIn;
        await userExists.save();

        await sendOtpMail(userExists.email, otp);

        return res.status(200).json({ message: "OTP sent successfully", otp: otp });

    } catch (error) {
        console.log(error);
        res.status(500).json({ 'internal server error3': error })
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { otp, password } = req.body;

        if (!otp || !password) {
            return res.status(400).json({ message: "please fill all the required fields" });
        }

        const userOtp = await user.findOne({ otp });
        if (!userOtp) {
            return res.status(400).json({ message: "Invalid Otp" });
        }
        if (userOtp.otp.expiresIn < new Date()) {
            res.status(400).json({ message: "Otp expired" });
        }


        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const userPassword = await user.findByIdAndUpdate(userOtp._id, { password: hashPassword }, { new: true });

        userOtp.otp = null;
        userOtp.expiresIn = null;
        await userOtp.save();

        res.clearCookie("token", null, {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });

        return res.status(200).json({
            message: "Password reset successfully",
            userPassword: userPassword,
        });


    }
    catch (error) {
        res.status(500).json({ message: 'internal server error4', error });
    }
}

export const googleLogin = async (req, res) => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    try {
        const { idToken } = req.body;

        const ticket = await client.verifyIdToken({    // Verify the ID token providede by google wiht client id
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getplayload();
        const { name, contact, email, college } = payload;
        const user = await user.findOne({ email });
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = await user.create({
                name,
                college,
                contact,
                email,
                password: hashedPassword
            });

        }

        const token = await generateToken(user);
        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            secure: false,
            sameSite: "none"
        }).status(200).json({
            message: "login successfully",
            userId: user._id.toString(),
            token: token
        }).json({ message: "login successfully", userId: user._id.toString(), token: token });
        console.log(token)

    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).json({ message: "Failed to authenticate with Google", error });

    }

}

