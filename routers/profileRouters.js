import {getProfile,updateProfile , deleteProfile, changePassword} from '../Controllers/profileControl.js';
import express from 'express';

const router = express.Router();

router.route('/:userId').get(getProfile);
router.route('/updateProfile/:userId').put(updateProfile);
router.route('/:userId').delete(deleteProfile);
router.route('/changePassword/:userId').put(changePassword);

export default router;