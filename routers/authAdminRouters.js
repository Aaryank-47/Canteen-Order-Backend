import express from 'express';
import { adminSignup, adminLogin, adminLogout, getAllAdmins } from '../Controllers/authAdminControl.js';
import {getProfile, updateProfile, deleteProfile} from '../Controllers/adminProfile.js'
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();


router.route('/signup').post(adminSignup);
router.route('/login').post(adminLogin);
router.route('/logout').post(adminLogout);
router.route('/verify-token').get(adminMiddleware, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin middleware is working",
        admin: req.admin
    });
})
router.route('/get-all-admins').get(getAllAdmins);

router.route('/profile/:adminId').get(getProfile);
router.route('/update-profile/:adminId').put(updateProfile);
router.route('/delete-profile').delete(deleteProfile);

export default router;