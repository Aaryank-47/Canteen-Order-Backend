import jwt from "jsonwebtoken";
import collegeModel from "../models/collegeModels.js";
import dotenv from "dotenv";

dotenv.config();

export const collegeMiddleware = async (req, res, next) => {
    try {

        const headerToken = req.headers.authorization?.split(" ")[1];
        console.log("headerToken via middleware: ",headerToken);

        const token = req.cookies.collegeToken;
        console.log("college cookies ---------or--------token via middleware : ",token);
        
        if (!token || token === "null") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }
        // Verify JWT
        const decoded = jwt.verify(token, process.env.COLLEGE_JWT_SK);
        console.log("decoded : ", decoded);

        const college = await collegeModel.findById(decoded.collegeId).select("-password");
        if (!college) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: College not found",
            });
        }
        console.log("college : ", college);
        console.log("College Cookies via middleware : ", req.cookies)
        
        
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