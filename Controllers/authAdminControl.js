import AdminModel from "../models/adminModel.js";
import collegeModel from "../models/collegeModels.js";
import foodModel from "../models/foodModel.js";
import bcrypt from "bcryptjs";
import { generateAdminToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
dotenv.config();


export const adminSignup = async (req, res) => {

    try {
        const { adminName, collegeName, phoneNumber, adminEmail, adminPassword, role } = req.body;

        if (!adminName || !collegeName || !phoneNumber || !adminEmail || !adminPassword || !role) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        const college = await collegeModel.findOne({ collegeName: collegeName.trim() });
        if (!college) {
            return res.status(400).json({ message: "College does not exist" });
        }

        const adminExists = await AdminModel.findOne({ adminEmail });
        if (adminExists) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(adminPassword, salt);

        try {
            const adminCreated = await AdminModel.create({
                adminName,
                collegeName: college.collegeName,
                collegeId: college._id,
                phoneNumber,
                adminEmail,
                adminPassword: hashPassword,
                role,
            })

            const adminToken = await generateAdminToken(adminCreated);
            res.cookie("adminToken", adminToken, {

                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
            }).status(201).json({
                message: "Admin created successfully",
                adminId: adminCreated._id.toString(),
                token: adminToken,
                adminInfo: adminCreated
            })

            console.log("adminToken: ", adminToken);
            console.log("adminCookies: ", req.cookies.adminToken);

        } catch (error) {
            res.status(500).json({ message: "Admin creation failed", error });
            console.log("Admin creation failed", error);
        }

    } catch (error) {
        console.log("INternal server error for signup");
        return res.status(500).json({ message: "Admin Interal Server Error ", error });
    }
}


export const adminLogin = async (req, res) => {
    try {
        const { adminEmail, adminPassword } = req.body;

        if (!adminEmail || !adminPassword) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        const adminExists = await AdminModel.findOne({ adminEmail });

        if (!adminExists) {
            return res.status(400).json({ message: "Admin does not exist" });
        }

        const isMatch = await bcrypt.compare(adminPassword, adminExists.adminPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Wrong password man!!!", error: error.message || error });
        }

        try {
            const adminToken = await generateAdminToken(adminExists);

            if (!adminToken) {
                res.status(400).json({ message: "Error in token generation" });
                console.log("Error in token generation")
            }

            res.cookie("adminToken", adminToken, {

                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
            }).status(201).json({
                message: "Admin Logged in Scuccessfully",
                adminId: adminExists._id.toString(),
                adminToken: adminToken,
                adminInfo: adminExists
            })


            console.log("adminToken: ", adminToken);
            console.log("while loggingIn with 'req.cookies.adminToken' adminCookies is : ", req.cookies.adminToken);
            console.log("while loggingIn with 'req.cookies' admincookie-> req.cookies is : ", req.cookies)

        } catch (error) {
            return res.status(500).json({ message: "Admin login failed", error: error.message || error.error });
        }

    } catch (error) {
        console.error("❌ Internal login error for:", req.body.adminEmail);
        console.error("❌ Error:", error);
        return res.status(500).json({ message: "Admin Interal Server Error 2", error: error.message || error });

    }
}

export const adminLogout = async (req, res) => {
    try {
        // const email = req.body.adminEmail;

        return res.cookie("adminToken", null, {
            httpOnly: true,
            expires: new Date(Date.now()),
            secure: false,
            sameSite: "lax"
        }).status(200).json({ message: `Admin  Logout Successfully`, adminToken: null })
        // }).status(200).json({message:`Admin with ${email} Logout Successfully`})
    } catch (error) {
        return res.status(500).json({ message: "Admin Interal Server Error 3", error });

    }
}


export const adminGoogleAuthLogin = async (req, res) => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    try {
        const { idToken } = req.body;

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { adminName, phoneNumber, adminEmail } = payload;
        const googleAdmin = await AdminModel.findOne({ adminEmail });
        if (!googleAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedadminPassword = await bcrypt.hash(adminPassword, salt);
            googleAdmin = await AdminModel.create({
                adminName,
                phoneNumber,
                adminEmail,
                adminPassword: hashedadminPassword,
            })
        }

        const token = await generateToken(googleAdmin);
        res.cookie("token", token, {

            expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            sameSite: 'None',
            secure: true,
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


export const getAllAdmins = async (req, res) => {
    try {
        const admins = await AdminModel.find({}).select("adminName");
        if (admins.length === 0) {
            return res.status(404).json({ message: "No admins found" });
        }
        return res.status(200).json({
            message: "All admins fetched successfully",
            admins: admins
        });
    } catch (error) {
        console.error("Error fetching all admins:", error);
        return res.status(500).json({ message: "Internal server error while fetching admins", error: error.message || error });
    }
}

export const getCanteenMenu = async (req, res) => {
    try {
        const { role, _id: adminId } = req.admin;
        if (role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const canteenMenu = await foodModel.find();
    } catch (error) {
        console.error("Error fetching canteen menu:", error);
        res.status(500).json({ message: "Internal server error on fetching canteen menu" });

    }
}


