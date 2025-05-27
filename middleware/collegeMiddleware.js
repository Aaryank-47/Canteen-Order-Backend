import jwt from "jsonwebtoken";
import collegeModel from "../models/collegeModels.js";
import dotenv from "dotenv";

dotenv.config();

export const collegeMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.collegeToken;
        if (!token || token === "null") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }
        // Verify JWT
        const decoded = jwt.verify(token, process.env.COLLEGE_JWT_SK);
        const college = await collegeModel.findById(decoded.collegeId).select("-password");
        if (!college) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: College not found",
            });
        }
        req.college = college;
        next();

    } catch (error) {
        console.error("Error in collegeMiddleware:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}