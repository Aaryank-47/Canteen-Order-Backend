import orderModel from "../models/orderModel.js";
import foodModel from "../models/foodModel.js";
import adminModel from "../models/adminModel.js";
import { calculateTotalPrice } from "../utils/calculateTotalprice.js";
import mongoose from "mongoose";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import req from "express/lib/request.js";


export const placeOrder = async (req, res) => {
    const { userId, foodItems } = req.body;
    const { adminId } = req.params;

    if (!userId || !foodItems || foodItems.length === 0) {
        console.log("Invalid request body:", req.body);
        return res.status(400).json({ message: "Please provide userId and foodItems" });
    }

    try {
        const canteen = await adminModel.findById(adminId);
        if (!canteen) {
            return res.status(404).json({ message: "Canteen not found" });
        }

        const today = new Date();
        const isNewDay = !canteen.lastOrderDate ||
            today.getDate() !== canteen.lastOrderDate.getDate() ||
            today.getMonth() !== canteen.lastOrderDate.getMonth() ||
            today.getFullYear() !== canteen.lastOrderDate.getFullYear();

        if (isNewDay) {
            canteen.dailyOrderCounter = 1;
        }

        const orderNumber = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(canteen.dailyOrderCounter).padStart(4, '0')}`;
        console.log("Generated order number:", orderNumber);

        const foodIds = foodItems.map(item => item.foodId);
        console.log("Food IDs to validate:", foodIds);

        const validItems = await foodModel.find({
            _id: { $in: foodIds },
            adminId: adminId,
            isActive: true
        });

        console.log("Searching for foods with:", {
            ids: foodIds,
            adminId: adminId,
            isActive: true
        });

        console.log("Valid food items found:", validItems.length);
        console.log("Total food items count:", foodItems.length);

        if (validItems.length !== foodItems.length) {
            return res.status(400).json({
                message: "Invalid items detected",
                validItemsCount: validItems.length,
                expectedCount: foodItems.length
            });
        }

        const foodPriceMap = validItems.reduce((acc, food) => {
            acc[food._id.toString()] = food.foodPrice;
            return acc;
        }, {});

        const totalPrice = foodItems.reduce((total, item) => {
            const itemPrice = foodPriceMap[item.foodId] || 0;
            const quantity = item.foodQuantity || 1;
            return total + (itemPrice * quantity);
        }, 0);

        console.log("Total price calculated:", totalPrice);

        const order = await orderModel.create({
            orderNumber,
            userId,
            adminId,
            foodItems: foodItems.map(item => ({
                foodId: item.foodId,
                foodQuantity: item.foodQuantity || 1
            })),
            totalPrice,
            status: 'Pending'
        });

        console.log("Order saved in DB:", order);

        // Update canteen counters
        canteen.dailyOrderCounter += 1;
        canteen.lastOrderDate = today;
        await canteen.save();

        res.status(201).json({
            success: true,
            orderNumber,
            totalPrice,
            message: `Order #${orderNumber} placed successfully`,
            orderDetails: {
                items: order.foodItems,
                status: order.status,
                createdAt: order.createdAt
            }
        });

    } catch (error) {
        console.log("Error placing order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// controllers/orderController.js
// export const getCanteenOrders = async (req, res) => {
//     try {
//         const { _id, role } = req.admin;
//         const { adminId: targetCanteenId } = req.params;
//         const { status, date } = req.query;


//         // 1. Authorization - Verify requesting admin owns this canteen
//         if (role !== "admin") {
//             return res.status(403).json({
//                 success: false,
//                 message: "Unauthorized access to orders"
//             });
//         }
//         console.log("_id : ", _id);
//         console.log("targetCanteenId || adminId : ", targetCanteenId)

//         // 2. Build base query
//         const query = {
//             canteen: targetCanteenId
//         };

//         // 3. Add optional filters
//         if (status) {
//             query.status = status; // Filter by status (pending/preparing/ready)
//         }

//         if (date) {
//             const startDate = new Date(date);
//             startDate.setHours(0, 0, 0, 0);

//             const endDate = new Date(date);
//             endDate.setHours(23, 59, 59, 999);

//             query.createdAt = {
//                 $gte: startDate,
//                 $lte: endDate
//             };
//         }

//         // 4. Fetch orders with populated user details
//         const orders = await orderModel.find(query)
//             .populate('user', 'name contact email')
//             .populate('items.food', 'foodName foodPrice')
//             .sort({ createdAt: -1 });

//         console.log("orders : ", orders);
//         // 5. Format response
//         res.status(200).json({
//             success: true,
//             count: orders.length,
//             canteenId: targetCanteenId,
//             orders: orders.map(order => ({
//                 orderNumber: order.orderNumber,
//                 user: order.user,
//                 items: order.items,
//                 total: order.items.reduce((sum, item) => sum + (item.food.foodPrice * item.quantity), 0),
//                 status: order.status,
//                 createdAt: order.createdAt
//             }))
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch orders",
//             error: error.message || "Internal server error"
//         });
//     }
// };
// export const placeOrder = async (req, res) => {

//     const { userId, foodItems } = req.body;
//     if (!userId || !foodItems || foodItems.length === 0) {
//         return res.status(400).json({ message: "Please provide userId and foodItems" });
//     }


//     let totalPrice = 0;
//     try {
//         for (const item of foodItems) {
//             const food = await foodModel.findById(item.foodId);
//             if (!food) {
//                 return res.status(404).json({ message: `Food not found with this id:${item.foodId}` });
//             }
//             const quantity = item.foodQuantity || 1;
//             totalPrice += food.foodPrice * quantity;


//         }

//         const getOrderNumber = async () => {
//             const latestOrder = await orderModel.findOne().sort({ orderNumber: -1 });
//             let nextOrderNumber;
//             const today = new Date();
//             today.setUTCHours(0, 0, 0, 0)
//             if (!latestOrder || latestOrder.createdAt < today) {
//                 nextOrderNumber = 1;
//             } else {
//                 nextOrderNumber = latestOrder.orderNumber + 1;
//             }
//             return nextOrderNumber;
//         }
//         const order_number = await getOrderNumber();


//         const newOrder = await orderModel.create({
//             userId,
//             foodItems,
//             totalPrice,
//             status: "Pending",
//             orderNumber: order_number,
//             createdAt: new Date()
//         });

//         if (!newOrder) {
//             return res.status(500).json({ message: "Failed to place order" });
//         }

//         return res.status(201).json({
//             message: "Order placed successfully",
//             order: newOrder,
//             orderNumber: order_number
//         });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Internal server error" });

//     }
// }

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
    if (!userId) {
        console.log("CouldNot get userId for order History");
    }
    console.log(`userId fetch for order history : ${userId}`)

    // ✅ Check for valid ObjectId early
    // if (!mongoose.Types.ObjectId.isValid(userId)) {
    //     return res.status(400).json({ message: "Invalid user ID" });
    // }

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
        })
            .populate({
                path: 'userId',
                select: 'name email contact' // Only include these fields from user
            })
            .populate({
                path: 'foodItems.foodId',
                select: 'foodName foodPrice' // Include these fields from food
            })
            .sort({ createdAt: -1 });

        
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalPrice: order.totalPrice,
            createdAt: order.createdAt,
            userInfo: {
                name: order.userId?.name,
                email: order.userId?.email,
                contact: order.userId?.contact
            },
            items: order.foodItems.map(item => ({
                foodId: item.foodId?._id,
                foodName: item.foodId?.foodName,
                foodPrice: item.foodId?.foodPrice,
                quantity: item.foodQuantity,
                itemTotal: (item.foodId?.foodPrice || 0) * (item.foodQuantity || 1)
            }))
        }));

        return res.status(200).json({
            success: true,
            message: orders.length ? "Orders fetched successfully" : "No orders found today",
            count: orders.length,
            orders: formattedOrders
        });

    } catch (error) {
        console.error("Error in getAllOrders:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const todaysOrdersCounts = async (req, res) => {
    try {

        const adminId = req.admin._id;
        if (!adminId) {
            console.log("Didn't get adminID : ", adminId);
        }
        console.log("ADMINid via todaysOrdersCounts() : ", adminId);

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const orders = await orderModel.find({
            adminId: adminId,
            createdAt: { $gte: start, $lte: end }
        });
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

        const adminId = req.admin._id;
        if (!adminId) {
            console.log("Didn't get adminID via getTodaysRevenue(): ", adminId);
        }
        console.log("ADMINid via getTodaysRevenue() : ", adminId);

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const orders = await orderModel.find({
            adminId: adminId,
            createdAt: { $gte: start, $lte: end },
            status: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"]
        });

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

    const adminId = req.admin._id;
    if (!adminId) {
        console.log("Didn't get adminID via getOrdersPerDay() : ", adminId);
    }
    console.log("ADMINid via getOrdersPerDay() : ", adminId);
    try {
        const order = await orderModel.find({
            adminId: adminId,
            status: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"]
        });

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

        const adminId = req.admin._id;
        if (!adminId) {
            console.log("Didn't get adminID via getPeakOrderHours() : ", adminId);
        }
        console.log("ADMINid via getPeakOrderHours() : ", adminId);


        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0); // Start of yesterday
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999); // End of yesterday

        // Step 2: Filter orders of yesterday only
        const orders = await orderModel.find({
            adminId: adminId,
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

export const last30DaysOrders = async (req, res) => {
    try {
        const adminId = req.admin._id;

        if (!adminId) {
            return res.status(400).json({ message: "Admin ID required" });
        }
        console.log("ADMINid via last30DaysOrders() : ", adminId);

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const orders = await orderModel.find({
            adminId,
            createdAt: {
                $gte: thirtyDaysAgo,
                $lte: today
            }
        }).populate({
            path: 'userId',
            select: 'name email contact'
        }).populate({
            path: 'foodItems.foodId',
            select: 'foodName foodPrice'
        }).sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalPrice: order.totalPrice,
            createdAt: order.createdAt,
            userInfo: {
                name: order.userId?.name,
                email: order.userId?.email,
                contact: order.userId?.contact
            },
            items: order.foodItems.map(item => ({
                foodId: item.foodId?._id,
                foodName: item.foodId?.foodName,
                foodPrice: item.foodId?.foodPrice,
                quantity: item.foodQuantity,
                itemTotal: (item.foodId?.foodPrice || 0) * (item.foodQuantity || 1)
            }))
        }));

        return res.status(200).json({
            success: true,
            message: orders.length ? "Orders fetched successfully" : "No orders found today",
            count: orders.length,
            orders: formattedOrders
        });

    } catch (error) {
        console.error("Error in last30Orders:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

export const getMonthWiseRevenvues = async (req, res) => {
    try {
        const adminId = req.admin._id;
        if (!adminId) {
            console.log("Didn't get adminID via getTodaysRevenue(): ", adminId);
        }
        console.log("ADMINid via getTodaysRevenue() : ", adminId);

        const getMonthWiseRevenvues = await orderModel.aggregate([
            {
                $match: {
                    adminId: adminId,
                    status: { $in: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] }
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            {
                $sort: {
                    "_id.month": 1
                }
            }
        ])
        if (!getMonthWiseRevenvues || getMonthWiseRevenvues.length === 0) {
            return res.status(404).json({ message: "No revenue data found for all these months" });
        }

        const monthlyRevenues = getMonthWiseRevenvues.map(item => ({
            month: item._id.month,
            totalRevenue: item.totalRevenue
        }));

        console.log("Monthly revenues:", monthlyRevenues);

        return res.status(200).json({
            success: true,
            message: "Monthly revenue data fetched successfully",
            revenues: monthlyRevenues
        });

    } catch (error) {
        console.error("Error in getMonthWiseRevenvues:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });

    }
}

export const getWeeklyRevenuesofMonth = async (req, res) => {
    try {
        const adminId = req.admin._id;
        console.log("ADMINid via getWeeklyRevenuesofMonth() : ", adminId);
        if (!adminId) {
            console.log("Didn't get adminID via getWeeklyRevenuesofMonth(): ", adminId);
        }

        const adminObjectId = new mongoose.Types.ObjectId(adminId);
        console.log("Admin ObjectId:", adminObjectId);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        console.log("Start of month:", startOfMonth);
        console.log("End of month:", endOfMonth);

        const weeklyRevenues = await orderModel.aggregate([
            {
                $match: {
                    adminId: adminObjectId,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: { $in: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] }
                }
            }, {
                $group: {
                    _id: {
                        weekOfMonth: {
                            $ceil: {
                                $divide: [
                                    { $dayOfMonth: "$createdAt" },
                                    // { $subtract: [{ $dayOfMonth: "$createdAt" }, 1] },

                                    7
                                ]
                            }
                        }
                    }
                    ,
                    // _id: { $week: "$createdAt" },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            }, {
                $sort: {
                    "_id": 1
                }
            }
        ])
        console.log("Weekly revenues aggregation result:", weeklyRevenues);

        if (!weeklyRevenues || weeklyRevenues.length === 0) {
            return res.status(404).json({ message: "No revenue data found for all these weeks" });
        }
        const weeklyRevenueData = weeklyRevenues.map(item => ({
            week: `Week ${item._id.weekOfMonth}`,
            totalRevenue: item.totalRevenue
        }));

        console.log("Weekly revenues:", weeklyRevenueData);

        return res.status(200).json({
            success: true,
            message: "Weekly revenue data fetched successfully",
            revenues: weeklyRevenueData
        });
    } catch (error) {
        console.error("Error in getWeeklyRevenuesofMonth:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });

    }
}

export const totalOrdersYet = async (req, res) => {
    try {
        const adminId = req.admin._id;
        console.log("ADMINid via totalOrdersYet() : ", adminId);
        if (!adminId) {
            return res.status(400).json({ message: "Admin ID required" });
        }

        const adminObjectId = new mongoose.Types.ObjectId(adminId);
        console.log("Admin ObjectId:", adminObjectId);

        const totalOrders = await orderModel.countDocuments({
            adminId: adminObjectId,
            status: { $in: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] }
        });
        console.log(`Total orders yet: ${totalOrders}`);

        return res.status(200).json({
            message: "Total orders fetched successfully",
            totalOrders
        });
    } catch (error) {
        console.error("Error in totalOrdersYet:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });

    }
}

export const totalRevenuesGenerated = async (req, res) => {
    try {
        const adminId = req.admin._id;
        console.log("ADMINid via totalRevenuesGenerated() : ", adminId);
        if (!adminId) {
            return res.status(400).json({ message: "Admin ID required" });
        }
        const adminObjectId = new mongoose.Types.ObjectId(adminId);
        console.log("Admin ObjectId:", adminObjectId);

        const totalRevenue = await orderModel.aggregate([
            {
                $match: {
                    adminId: adminObjectId,
                    status: { $in: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalPrice" }
                }
            }
        ]);

        console.log("Total revenue aggregation result:", totalRevenue);
        if (!totalRevenue || totalRevenue.length === 0) {
            return res.status(404).json({ message: "No revenue data found" });
        }
        const totalRevenueSum = totalRevenue[0].totalRevenue;
        console.log(`Total revenue generated: ${totalRevenueSum}`);

        return res.status(200).json({
            message: "Total revenue fetched successfully",
            totalRevenueSum
        });

    } catch (error) {
        console.error("Error in totalRevenuesGenerated:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

export const getWeeklySalesOverviewPerDay = async (req, res) => {
    try {
        const adminId = req.admin._id;
        console.log("ADMINid via getWeeklySalesOverviewPerDay() : ", adminId);
        if (!adminId) {
            console.log("Didn't get adminID via getWeeklySalesOverviewPerDay(): ", adminId);
            return res.status(400).json({ message: "Admin ID required" });
        }

        const adminObjectId = new mongoose.Types.ObjectId(adminId);
        console.log("Admin ObjectId:", adminObjectId);

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);


        const extractDaysofWeek = await orderModel.aggregate([
            {
                $match: {
                    adminId: adminObjectId,
                    status: { $in: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] },
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek }
                }
            },
            {
                $group: {
                    _id: {
                        weekday: { $dayOfWeek: "$createdAt" },
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            {
                $addFields: {
                    "dayName": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.weekday", 1] }, then: "Sun" },
                                { case: { $eq: ["$_id.weekday", 2] }, then: "Mon" },
                                { case: { $eq: ["$_id.weekday", 3] }, then: "Tue" },
                                { case: { $eq: ["$_id.weekday", 4] }, then: "Wed" },
                                { case: { $eq: ["$_id.weekday", 5] }, then: "Thu" },
                                { case: { $eq: ["$_id.weekday", 6] }, then: "Fri" },
                                { case: { $eq: ["$_id.weekday", 7] }, then: "Sat" }
                            ],
                            default: "Unknown"
                        }
                    }
                }
            },
            {
                $sort: {
                    "_id": 1
                }
            }
        ])

        const weeklySalesOverview = extractDaysofWeek.map(item => ({
            dayOfWeek: item.dayName,
            date: item._id.date,
            totalRevenue: item.totalRevenue
        }));

        return res.status(200).json({
            message: "Weekly sales overview fetched successfully",
            weeklySalesOverview
        });

    } catch (error) {
        console.error("Error in getWeeklySalesOverviewPerDay:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}