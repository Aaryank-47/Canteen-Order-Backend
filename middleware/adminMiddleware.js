import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";
import dotenv from "dotenv";

dotenv.config();

export const adminMiddleware = async (req, res, next) => {
    try {
        const headerToken = req.headers.authorization?.split(' ')[1];
        console.log("headerToken via adminMiddeware : ", headerToken)
        
        const token = req.cookies.adminToken || headerToken;
        console.log("cookiesssssssss ....................... token in middleware : ",token)
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        
        const decoded = jwt.verify(token, process.env.JWT_SK);
        console.log("decoded",decoded)

        
        const admin = await adminModel.findById(decoded.adminId).select("-adminPassword");
        console.log("admin inside middleware : ", admin);
        

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admins only",
                error: "Invalid role or admin not found"
            });
        }
        console.log("Admin role:", admin?.role);
        console.log("Cookies via admin middleware :", req.cookies);
        // console.log("Decoded JWT:", decoded);
        // console.log("Admin found:", admin);

        req.admin = admin;
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again.",
                error: error.message
            });
        }

        console.error("Error in adminMiddleware:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
