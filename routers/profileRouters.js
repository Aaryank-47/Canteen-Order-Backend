import {getProfile,updateProfile , deleteProfile, changePassword} from '../Controllers/profileControl.js';
// import { authMiddleware } from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

// router.route('/:userId').get(authMiddleware,getProfile);
router.route('/:userId').get(getProfile);
router.route('/update-profile/:userId').put(updateProfile);
router.route('/:userId').delete(deleteProfile);
router.route('/changePassword/:userId').put(changePassword);

export default router;