import express from 'express';
import {placeOrder,orderUpdatesByAdmin,orderUpdatesByUser,orderHistory,getAllOrders} from '../Controllers/orderControls.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
// import { authOrAdminAuthMiddleware } from '../middleware/authoradminauthMidlleware.js';
const router = express.Router();

router.route('/place-order').post(authMiddleware,placeOrder);
router.route('/order-history/:userId').get(orderHistory);
router.route('/admin-order-update/:orderId/:status').put(adminMiddleware,orderUpdatesByAdmin);
router.route('/user-order-cancel/:orderId').put(authMiddleware,orderUpdatesByUser);
router.route('/get-all-orders/:adminId').get(adminMiddleware,getAllOrders);

export default router;  