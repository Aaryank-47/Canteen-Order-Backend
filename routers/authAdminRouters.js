import express from 'express';
import {adminSignup, adminLogin, adminLogout} from '../Controllers/authAdminControl.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';


const router = express.Router();

router.route('/signup').post(adminSignup);
router.route('/login').post(adminLogin);
router.route('/logout').post(adminLogout);
router.route('/check-admin-middleware').get(adminMiddleware,(req,res)=>{
    res.send("admin middleware is working");
})

export default router;