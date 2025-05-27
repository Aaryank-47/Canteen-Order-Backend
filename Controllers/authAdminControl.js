import admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import {generateAdminToken} from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
dotenv.config();


export const adminSignup = async (req, res) => {

    try {
        const { adminName, collegeName, phoneNumber, adminEmail, adminPassword, role } = req.body;

        if (!adminName || !collegeName || !phoneNumber || !adminEmail || !adminPassword || !role) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        const adminExists = await admin.findOne({ adminEmail });
        if (adminExists) {
            return res.status(400).json({ message: "Admin already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(adminPassword, salt);

        try {
            const adminCreated = await admin.create({
                adminName,
                collegeName,
                phoneNumber,
                adminEmail,
                adminPassword: hashPassword,
                role,
            })

            const token = await generateAdminToken(adminCreated);
            res.cookie("adminToken", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                secure: false,
                sameSite: "none"
            }).status(201).json({
                message: "Admin created successfully",
                adminId: adminCreated._id.toString(),
                token: token,
                adminInfo: adminCreated
            })

            console.log("adminToken: ", token);
            console.log("adminCookies: ", req.cookies.token);

        } catch (error) {
            res.status(500).json({ message: "Admin creation failed", error });
            console.log("Admin creation failed", error);
        }

    } catch (error) {
        return res.status(500).json({ message: "Admin Interal Server Error ", error });
    }
}


export const adminLogin = async (req, res) => {
    try {
        const { adminEmail, adminPassword } = req.body;
        if (!adminEmail || !adminPassword) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        const adminExists = await admin.findOne({ adminEmail });
        if (!adminExists) {
            return res.status(400).json({ message: "Admin does not exist" });
        }
        const isMatch = await bcrypt.compare(adminPassword, adminExists.adminPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Wrong password man!!!" });
        }

        try {
            const token = await generateToken(adminExists);
            res.cookie("token", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                secure: false,
                sameSite: "none"
            }).status(201).json({
                message: "Admin Logged in Scuccessfully",
                adminId: adminExists._id.toString(),
                token: generateToken(adminExists),
                adminInfo: adminExists
            })
        } catch (error) {
            return res.status(500).json({ message: "Admin login failed", error });
        }

    } catch (error) {
        return res.status(500).json({ message: "Admin Interal Server Error 2", error });

    }
}

export const adminLogout = async(req,res)=>{
    try {
        // const email = req.body.adminEmail;

        return res.cookie("token", null, {
            httpOnly:true,
            expires:new Date(Date.now()),
            secure:false,
            sameSite:"none"
        }).status(200).json({message:`Admin  Logout Successfully`})
        // }).status(200).json({message:`Admin with ${email} Logout Successfully`})
    } catch (error) {
        return res.status(500).json({ message: "Admin Interal Server Error 3", error });
        
    }
}


export const adminGoogleAuthLogin = async (req,res) =>{
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    try {
        const {idToken} = req.body;
        
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const {adminName, PhoneNumber, adminEmail} = payload;
        const googleAdmin = await admin.findOne({adminEmail});
        if(!googleAdmin){
            const salt = await bcrypt.genSalt(10);
            const  hashedadminPassword = await bcrypt.hash(adminPassword, salt);
            googleAdmin = await admin.create({
                adminName,
                phoneNumber,
                adminEmail,
                adminPassword: hashedadminPassword,
            })
        } 

        const token = await fenerateToken(googleAdmin);
        res.cookie("token",token,{
            httOnly : true,
            expires : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            secure : false,
            sameSite : "none"
        }).status(200).json({
            message: "Admin login successfully",
            adminId: googleAdmin._id.toString(),
            token: token,
            adminInfo: googleAdmin
        })

    } catch (error) {
        return res.status(500).json({ message: "Admin Interal Server Error 4", error });
        
    }
}
