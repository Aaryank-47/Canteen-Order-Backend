import express from 'express';
import { adminSignup, adminLogin, adminLogout, getAllAdmins } from '../Controllers/authAdminControl.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { get } from 'mongoose';


const router = express.Router();

router.route('/signup').post(adminSignup);
router.route('/login').post(adminLogin);
router.route('/logout').post(adminLogout);
router.route('/verify-token').get(adminMiddleware, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin middleware is working",
        admin: req.admin, // Optional: include admin info
    });
})
router.route('/get-all-admins').get(getAllAdmins);

export default router;