import express from "express";
import { signup, login, logout, forgotPassword, resetPassword, googleLogin, getUser } from "../Controllers/authControls.js"
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

router.route("/verify-token").get(authMiddleware, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Token is valid",
        user: req.user  
    });
});

router.route("/").get((req, res) => {
    res.send('Get all users');
})

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/google-login").post(googleLogin)
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword").post(authMiddleware, resetPassword);
router.route("/get-user").get(authMiddleware, getUser);



export default router;
