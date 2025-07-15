import express from 'express';
import {placeOrder,orderUpdatesByAdmin,orderUpdatesByUser,orderHistory,getAllOrders, todaysOrdersCounts, getTodaysRevenue, getOrdersPerDay, getPeakOrderHours,getCanteenOrders} from '../Controllers/orderControls.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
// import { authOrAdminAuthMiddleware } from '../middleware/authoradminauthMidlleware.js';
const router = express.Router();

router.route('/admins/:adminId/place-order').post(authMiddleware,placeOrder);
// router.route('/place-order').post(authMiddleware,placeOrder);
router.route('/order-history/:userId').get(orderHistory);

router.route('/admin-order-update/:orderId/:status').put(adminMiddleware,orderUpdatesByAdmin);
router.route('/user-order-cancel/:orderId').put(authMiddleware,orderUpdatesByUser);

router.route('/get-all-orders/:adminId').get(adminMiddleware,getAllOrders);
router.route('/todays-total-orders').get(adminMiddleware,todaysOrdersCounts);
router.route('/todays-revenue').get(adminMiddleware,getTodaysRevenue);
// router.route('/get-order-by-user/:userId').get(authMiddleware,orderHistory);
router.route('/orders-per-day').get(adminMiddleware,getOrdersPerDay);
router.route('/peak-order-hours').get(adminMiddleware,getPeakOrderHours);
router.route('/get-canteen-orders/:adminId').get(adminMiddleware,getCanteenOrders);
export default router;     