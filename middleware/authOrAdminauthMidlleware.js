import { authMiddleware } from "./authMiddleware.js";
import { adminMiddleware } from "./adminMiddleware.js";

export const authOrAdminAuthMiddleware = async (req, res, next) => {
    try {
        await authMiddleware(req,res,()=>{
            req.isUser = true;
            next();
        });
    } catch (userError) {
        try {
            await adminMiddleware(req,res,()=>{
                req.isAdmin = true;
                next();
            })
        } catch (adminError) {
            return res.status(401).json({message: "Unauthorized: User or Admin token required"})
        }
    }
}