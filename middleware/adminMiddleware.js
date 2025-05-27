import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";
import dotenv from "dotenv";

dotenv.config();

export const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SK);

        // Corrected this line ↓
        const admin = await adminModel.findById(decoded.userId).select("-adminPassword");

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admins only",
            });
        }

        req.admin = admin; // Attach admin info to request
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again.",
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
