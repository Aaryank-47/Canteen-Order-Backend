import express from "express";
import {signup,login,logout,forgotPassword,resetPassword} from "../Controllers/authControls.js"
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authOrAdminAuthMiddleware } from "../middleware/authoradminauthMidlleware.js";

const router = express.Router();

router.route("/").get((req,res)=>{
    res.send('Get all users');
})

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword").post(authMiddleware,resetPassword);
router.route("/protected").get(authMiddleware,(req,res)=>{
    res.send("Protected route");
});
router.route("/check-user-admin-auth").get(authOrAdminAuthMiddleware, (req, res) => {
    res.send("User/Admin authenticated");
});



export default router;