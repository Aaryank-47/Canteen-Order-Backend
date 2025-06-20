import jwt from "jsonwebtoken";
import User from "../models/authModels.js";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
    try {
        // const authHeader = req.headers['authorization'];
        // const userToken = authHeader && authHeader.split(' ')[1];

        // const userToken = req.cookies.userToken || req.headers.authorization?.split(" ")[1];

        const userToken = req.cookies.userToken;
        console.log("userToken via authMiddleware : ", userToken);

        if (!userToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access : No Token Provided "
            });
        }

        const decoded = jwt.verify(userToken, process.env.JWT_SK);
        console.log("Decoded JWT in authMiddleware:", decoded);

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access : user not found",
                error: "User not found or invalid token"
            });
        }
        console.log("User found in authMiddleware:", user);
        console.log("Cookies via authMiddleware:", req.cookies);

        res.status(200).json({ message: "User authenticated successfully" });
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again.",
                error: error.message
            });
        }
        
        console.error("Error in authMiddleware:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
