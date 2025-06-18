import express from 'express';
import { registration, login, logout, getAllColleges, getsingleCollege, deleteCollege, addCollegeCanteens } from '../Controllers/collegeControls.js';
import { collegeMiddleware } from '../middleware/collegeMiddleware.js';
const router = express.Router();

router.route('/verify-college-token').get(collegeMiddleware, (req, res) => {
    res.status(200).json({
        success: true,
        message: "College middleware is working",
        college: req.college,
    });
})
router.route('/register').post(registration);
router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/all-colleges').get(getAllColleges);
router.route('/single-college/:college_id').get(getsingleCollege);
router.route('/delete-college/:college_id').delete(deleteCollege);
router.route('/add-college-canteens/:college_id').post(collegeMiddleware, addCollegeCanteens);


export default router;