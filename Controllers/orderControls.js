import orderModel from "../models/orderModel.js";
import foodModel from "../models/foodModel.js";
import mongoose from 'mongoose';
import { calculateTotalPrice } from "../utils/calculateTotalprice.js";

export const placeOrder = async (req, res) => {

    const { userId, foodItems } = req.body;
    if (!userId || !foodItems || foodItems.length === 0) {
        return res.status(400).json({ message: "Please provide userId and foodItems" });
    }


    let totalPrice = 0;
    try {
        for (const item of foodItems) {
            const food = await foodModel.findById(item.foodId);
            if (!food) {
                return res.status(404).json({ message: `Food not found with this id:${item.foodId}` });
            }
            const quantity = item.foodQuantity || 1;
            totalPrice += food.foodPrice * quantity;


        }

        const getOrderNumber = async () => {
            const latestOrder = await orderModel.findOne().sort({ orderNumber: -1 });
            let nextOrderNumber;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0)
            if (!latestOrder || latestOrder.createdAt < today) {
                nextOrderNumber = 1;
            } else {
                nextOrderNumber = latestOrder.orderNumber + 1;
            }
            return nextOrderNumber;
        }
        const order_number = await getOrderNumber();


        const newOrder = await orderModel.create({
            userId,
            foodItems,
            totalPrice,
            status: "Pending",
            orderNumber: order_number,
            createdAt: new Date()
        });

        if (!newOrder) {
            return res.status(500).json({ message: "Failed to place order" });
        }

        return res.status(201).json({
            message: "Order placed successfully",
            order: newOrder,
            orderNumber: order_number
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });

    }
}

// ------------------ order updates for both admin and users in single functions------------------

// export const orderUpdates = async (req, res) => {
//     const { orderId, status } = req.params;

//     if (!orderId || !status) {
//         return res.status(400).json({ message: "Please provide orderId and status in URL" });
//     }

//     // Safely get user or admin identity
//     const user = req.user;
//     const admin = req.admin;

//     if (!user && !admin) {
//         return res.status(403).json({ message: "Unauthorized access: No user or admin identity found" });
//     }

//     const order = await orderModel.findById(orderId);
//     if (!order) {
//         return res.status(404).json({ message: "Order not found" });
//     }


//     if (req.isAdmin) {
//         const validTransitions = ["Pending", "Preparing", "Ready", "Delivered"];
//         const currentIndex = validTransitions.indexOf(order.status);
//         const nextIndex = validTransitions.indexOf(status);

//         if (currentIndex === -1 || nextIndex === -1) {
//             return res.status(400).json({ message: "Invalid status transition" });
//         }

//         if (nextIndex !== currentIndex + 1) {
//             return res.status(400).json({ message: `Cannot move from '${order.status}' to '${status}'` });
//         }

//         const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

//         return res.status(200).json({
//             message: `Order status updated to '${status}' successfully`,
//             order: updatedOrder
//         });
//     }


//     else if (req.isUser) {
//         const timeDiff = Date.now() - new Date(order.createdAt).getTime();

//         if (status !== "Cancelled") {
//             return res.status(403).json({ message: "Users can only cancel orders" });
//         }

//         if (timeDiff > 3 * 60 * 1000 || order.status !== "Pending") {
//             return res.status(400).json({ message: "Order cannot be cancelled after 3 minutes or if not pending" });
//         }

//         const cancelledOrder = await orderModel.findByIdAndUpdate(orderId, { status: "Cancelled" }, { new: true });

//         return res.status(200).json({
//             message: "Order cancelled successfully",
//             order: cancelledOrder
//         });
//     }


//     return res.status(403).json({ message: "Unauthorized role to perform this action" });
// };

// export const orderUpdates = async (req, res) => {
//   const { orderId, status } = req.params;

//   if (!orderId || !status) {
//     return res.status(400).json({ message: "Please provide orderId and status in URL" });
//   }


//   const user = req.user;
//   const admin = req.admin;

//   if (!user && !admin) {
//     return res.status(403).json({ message: "Unauthorized access: No user or admin identity found" });
//   }

//   const order = await orderModel.findById(orderId);
//   if (!order) {
//     return res.status(404).json({ message: "Order not found" });
//   }


//   if (admin?.role === "admin") {
//     const validTransitions = ["Pending", "Preparing", "Ready"];
//     const currentIndex = validTransitions.indexOf(order.status);
//     const nextIndex = validTransitions.indexOf(status);

//     if (currentIndex === -1 || nextIndex === -1) {
//       return res.status(400).json({ message: "Invalid status transition" });
//     }

//     if (nextIndex !== currentIndex + 1) {
//       return res.status(400).json({ message: `Cannot move from '${order.status}' to '${status}'` });
//     }

//     const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

//     return res.status(200).json({
//       message: `Order status updated to '${status}' successfully`,
//       order: updatedOrder
//     });
//   }


//   else if (user?.usertype === "user") {
//     const timeDiff = Date.now() - new Date(order.createdAt).getTime();

//     if (status.toLowerCase() !== "cancelled") {
//       return res.status(403).json({ message: "Users can only cancel orders" });
//     }

//     if (timeDiff > 3 * 60 * 1000 || order.status !== "Pending") {
//       return res.status(400).json({ message: "Order cannot be cancelled after 3 minutes or if not pending" });
//     }

//     const cancelledOrder = await orderModel.findByIdAndUpdate(orderId, { status: "Cancelled" }, { new: true });

//     return res.status(200).json({
//       message: "Order cancelled successfully",
//       order: cancelledOrder
//     });
//   }

//   return res.status(403).json({ message: "Unauthorized role to perform this action" });
// };
// ------------------ order updates for both admin and users in two functions------------------


export const orderUpdatesByAdmin = async (req, res) => {
    const { orderId, status } = req.params;
    if (!orderId || !status) {
        return res.status(400).json({ message: "Please provide orderId and status in URL" });
    }
    const admin = req.admin;
    if (!admin) {
        return res.status(403).json({ message: "Unauthorized access: No admin identity found" });
    }
    try {

        const orderStatusTransitions = ["Pending", "Preparing", "Ready"];
        const currentIndex = orderStatusTransitions.indexOf(status);
        const nextIndex = orderStatusTransitions.indexOf(status);
        if (currentIndex === -1 || nextIndex === -1) {
            return res.status(400).json({ message: "Invalid status transition" });
        }

        const updateOrderStatus = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!updateOrderStatus) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            message: `Order status updated to '${status}' successfully`,
            order: updateOrderStatus
        });



    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error on orderUpdatesByAdmin" });
    }
}

export const orderUpdatesByUser = async (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
        return res.status(400).json({ message: "Please provide orderId and status in URL" });
    }
    const user = req.user;
    if (!user) {
        return res.status(403).json({ message: "Unauthorized access: No user identity found" });
    }

    try {

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const timeDiff = Date.now() - new Date(order.createdAt).getTime();

        if (timeDiff > 3 * 60 * 1000) {
            return res.status(400).json({ message: "Order cannot be cancelled after 3 minutes or if not pending" });
        }

        if (order.status !== "Pending") {
            return res.status(400).json({ message: "Only pending orders can be cancelled" });
        }

        const cancelledOrder = await orderModel.findByIdAndUpdate(orderId, { status: "Cancelled" }, { new: true });
        if (!cancelledOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            message: "Order cancelled successfully",
            order: cancelledOrder
        });

    } catch (error) {

        console.log(error);
        return res.status(500).json({ message: "Internal server error on orderUpdatesByUser" });

    }
}



export const orderHistory = async (req, res) => {
    const { userId } = req.params;

    // ✅ Check for valid ObjectId early
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
        // ✅ Fetch and populate food item details inside each order
        const orders = await orderModel
            .find({
                userId,
                status: { $in: ["Delivered", "Cancelled", "Pending", "Preparing", "Ready"] },
            })
            .populate({
                path: 'foodItems.foodId',
                select: 'foodName foodPrice foodImage'
            })
            .sort({ createdAt: -1 });

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                message: "This user has not ordered any food till date.",
                orders: orders,
            });
        }

        return res.status(200).json({
            message: "Order history fetched successfully",
            orders: orders,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getAllOrders = async (req, res) => {
    try {
        const { adminId } = req.params;

        if (!adminId) {
            return res.status(400).json({ message: "Admin ID required" });
        }

        // Use UTC to avoid timezone issues
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setUTCDate(today.getUTCDate() + 1);

        const orders = await orderModel.find({
            adminId,
            status: { $in: ["Pending", "Preparing", "Ready", "Delivered"] },
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: orders.length ? "Orders fetched successfully" : "No orders found today",
            orders: orders
        });

    } catch (error) {
        console.error("Error in getAllOrders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const todaysOrdersCounts = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const orders = await orderModel.find({ createdAt: { $gte: start, $lte: end } });
        const orderCounts = orders ? orders.length : 0; // Handle case where orders might be null, although find should return empty array

        console.log(`Today's orders count: ${orderCounts}`);

        return res.status(200).json({
            message: orders && orders.length > 0 ? "Today's orders fetched successfully" : "No orders found for today 1",
            totalOrders: orderCounts
        });



        // if (!orders || orders.length === 0) {
        //     return res.status(201).json({ 
        //         message: "No orders found for today",
        //         totalOrders: orders.length
        //     });
        // }

        // const orderCounts = orders.length;
        // console.log(`Today's orders count: ${orderCounts}`);

        // return res.status(200).json({
        //     message: "Today's orders fetched successfully",
        //     totalOrders: orderCounts
        // });
    } catch (error) {
        console.error("Error in todaysOrders:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });

    }
}

export const getTodaysRevenue = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const orders = await orderModel.find({ createdAt: { $gte: start, $lte: end }, status: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] });
        
        // if (!orders || orders.length === 0) {
        //     return res.status(404).json({ 
        //         message: "No delivered orders found for today",
        //         totalRevenueSum: 0
        //     });
        // }

        const totalRevenue = await Promise.all(
            orders.map(async (order) => await calculateTotalPrice(order.foodItems))
        );

        const totalRevenueSum = totalRevenue.reduce((acc, curr) => acc + curr, 0);
        if (totalRevenueSum === 0 || !orders || orders.length === 0) {
            return res.status(200).json({ 
                message: "No revenue generated today",
                totalRevenueSum: 0
            });
        }

        console.log(`Today's total revenue: ${totalRevenueSum}`);
        return res.status(200).json({
            message: "Today's revenue fetched successfully",
            totalRevenueSum
        });

    } catch (error) {
        console.error("Error in getTodaysRevenue:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });

    }
}

export const getOrdersPerDay = async (req, res) => {
    try {
        const order = await orderModel.find({ status: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] });

        if (!order || order.length === 0) {
            return res.status(404).json({ message: "No orders found" });
        }

        const orersPerDayMap = {};

        order.forEach((order) => {
            const date = new Date(order.createdAt).toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
            if (!orersPerDayMap[date]) {
                orersPerDayMap[date] = 0;
            }
            orersPerDayMap[date]++;
        });
        const ordersPerDayArray = Object.entries(orersPerDayMap).map(([date, count]) => ({ date, count })).sort((a, b) => new Date(b.date) - new Date(a.date));;
        if (ordersPerDayArray.length === 0) {
            return res.status(404).json({ message: "No orders found for any day" });
        }

        console.log("Orders per day:", ordersPerDayArray);
        return res.status(200).json({
            message: "Orders per day fetched successfully",
            ordersPerDay: ordersPerDayArray
        });

    } catch (error) {
        console.error("Error in getOrdersPerDay:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });

    }
}

export const getPeakOrderHours = async (req, res) => {
    try {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0); // Start of yesterday
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999); // End of yesterday

        // Step 2: Filter orders of yesterday only
        const orders = await orderModel.find({
            status: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"],
            createdAt: { $gte: yesterday, $lte: endOfYesterday }
        });

        const slots = [
            "9-10 AM", "10-11 AM", "11-12 PM",
            "12-1 PM", "1-2 PM", "2-3 PM",
            "3-4 PM", "4-5 PM", "5-6 PM"
        ]

        const timeSlotMap = {};
        orders.forEach((order) => {
            const hour = new Date(order.createdAt).getHours();
            const slotIndex = Math.floor((hour - 9) / 1); // Assuming orders are between 9 AM and 6 PM
            if (slotIndex >= 0 && slotIndex < slots.length) {
                if (!timeSlotMap[slots[slotIndex]]) {
                    timeSlotMap[slots[slotIndex]] = 0;
                }
                timeSlotMap[slots[slotIndex]]++;
            }
        });


        const peakOrderHours = Object.entries(timeSlotMap)
            .map(([slot, count]) => ({ slot, count }))
            .sort((a, b) => b.count - a.count);

        if (peakOrderHours.length === 0) {
            return res.status(404).json({ message: "No orders found for any time slot" });
        }

        console.log("Peak order hours:", peakOrderHours);
        return res.status(200).json({
            message: "Peak order hours fetched successfully",
            peakOrderHours: peakOrderHours
        });


    } catch (error) {
        console.error("Error in getPeakOrderHours:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });

    }
}
