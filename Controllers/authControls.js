import userModel from "../models/authModels.js"
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import { sendOtpMail } from "../utils/mailer.js"
import generateotp from "../utils/otpGenerator.js";
import { OAuth2Client } from "google-auth-library"

export const signup = async (req, res) => {
    try {
        const { name, contact, college, email, password } = req.body;

        if (!name || !contact || !college || !email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "user already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt)


        try {
            const userCreated = await userModel.create({
                name,
                contact,
                college,
                email,
                password: hashPassword
            });

            // if (!profileCreated) {
            //     return res.status(400).json({ message: "Profile not created" });
            // }   

            const userToken = await generateToken(userCreated);

            res.cookie("userToken", userToken, {
                httpOnly: true,
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                // secure: true,
                secure: false,
                sameSite: "lax"
            }).status(201).json({
                message: "user created successfully",
                userId: userCreated._id.toString(),
                userToken: userToken,
                // cookies: req.cookies.userToken,
                user: {
                    name: userCreated.name,
                    contact: userCreated.contact,
                    college: userCreated.college,
                    email: userCreated.email
                }
            })
            console.log("usertoken:", userToken);
            console.log("cookies:", req.cookies.userToken);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error });
        }

    } catch (error) {
        res.status(500).json({ "internal server error1": error.message || error })
    }
}



export const login = async (req, res) => {

    try {
        const { email, contact, password } = req.body;

        if ((!email && !contact) || !password) {
            return res.status(400).json({ message: "Please provide email/phone and password" });
        }

        // Find user by email or phone
        const userExists = email
            ? await userModel.findOne({ email })
            : await userModel.findOne({ contact });

        if (!userExists) {
            return res.status(400).json({ message: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(password, userExists.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        try {
            const userToken = generateToken(userExists);

            if (!userToken) {
                res.status(400).json({ message: "Error in token generation" });
                console.log("Error in token generation")
            }

            res.cookie("userToken", userToken, {
                httpOnly: true,
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                // secure: true,
                secure: false,
                sameSite: "lax"
            }).status(200).json({
                message: "login successfully",
                userId: userExists._id.toString(),
                userToken: userToken,
                // cookies: req.cookies.userToken,
                user: {
                    name: userExists.name,
                    contact: userExists.contact,
                    college: userExists.college,
                    email: userExists.email
                }
            });
            console.log("userToken via users login : ", userToken);
            console.log("req.cookies via users login : ", req.cookies); // Add this
            console.log("req.cookies.userToken via users login : ", req.cookies.userToken);
            console.log("Response headers : ", res.getHeaders());
        } catch (error) {

            console.error("Error generating token:", error.message);
            res.status(500).json({ message: "Error generating token", error: error.message || error });
        }
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ 'internal server error2': error })
    }

}


export const logout = async (req, res) => {
    try {
        // res.cookie("token", null, {
        //     httpOnly: true,
        //     expires: new Date(Date.now()),
        //     secure: false,
        //     sameSite: "lax"
        // }).status(200).json({message:"logged out null successfully", token: null})
        console.log(" req.cookies.userToken : ",  req.cookies.userToken)
        res.clearCookie("userToken");
        res.status(200).json({ message: "logged out clear successfully", userToken: null });
    }
    catch (error) {
        res.status(500).json({ 'internal server error3': error })
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const userExists = await userModel.findOne({ email });

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

        const userOtp = await userModel.findOne({ otp });
        if (!userOtp) {
            return res.status(400).json({ message: "Invalid Otp" });
        }
        if (userOtp.otp.expiresIn < new Date()) {
            res.status(400).json({ message: "Otp expired" });
        }


        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const userPassword = await userModel.findByIdAndUpdate(userOtp._id, { password: hashPassword }, { new: true });

        userOtp.otp = null;
        userOtp.expiresIn = null;
        await userOtp.save();

        res.clearCookie("userToken", null, {
            httpOnly: true,
            // secure: true,
            secure: false,
            sameSite: "lax"
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
        const { userToken } = req.body;

        console.log("userToken : ", userToken);

        const ticket = await client.verifyIdToken({    // Verify the ID token providede by google wiht client id
            idToken : userToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        console.log("ticket : ", ticket);

        const payload = ticket.getPayload();

        console.log(" Getting Payload : ", payload)

        const { name, contact, email, college } = payload;


        const userFind = await userModel.findOne({ email });



        console.log("user Found :  ", userFind);

        if (!userFind) {
            // const salt = await bcrypt.genSalt(10);
            // const hashedPassword = await bcrypt.hash(password, salt);

            const CreateUser = await userModel.create({
                name,
                college,
                contact,
                email,
                // password: hashedPassword
            });

            console.log("CreateUser :  ", CreateUser)

            if (!CreateUser) {
                res.status(404).json({
                    message: "user can not been created by userId "
                })
            }
            const userToken = await generateToken(CreateUser);
            res.cookie("userToken", userToken, {
                httpOnly: true,
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                secure: false,
                sameSite: "lax"
            }).status(200).json({
                message: "Google login successfully",
                userId: CreateUser._id.toString(),
                CreateUser: {
                    name: CreateUser.name,
                    email: CreateUser.email,
                    contact: CreateUser.contact,
                    college: CreateUser.college
                },
                userToken: userToken
            });
            console.log(userToken)
        } else {
            const userToken = await generateToken(userFind._id);
            return res.cookie("userToken", userToken, {
                httpOnly: true,
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                secure: false,
                sameSite: "lax"
            }).status(200).json({
                message: "Google login successful (existing user)",
                userId: userFind._id.toString(),
                user: {
                    name: userFind.name,
                    email: userFind.email,
                    contact: userFind.contact
                },
                userToken
            });
        }



    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).json({ message: "Failed to authenticate with Google", error });

    }

}

export const getUser = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).select("-password -otp -expiresIn");
        console.log("User ID:", req.user._id);
        console.log("User fetched:", user);

        if (!user) {
            console.log("User not found");
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User fetched successfully",
            user: {
                name: user.name,
                contact: user.contact,
                college: user.college,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal Server error', error: error.message });
    }
}