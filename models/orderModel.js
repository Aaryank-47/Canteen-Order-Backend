import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
     orderNumber: {
        type: Number
    },
    foodItems: [  // This should match what you're actually using in your data
        {
            foodId: {  // This matches your actual data structure
                type: mongoose.Schema.Types.ObjectId,
                ref: "Food",
                required: true
            },
            foodQuantity: {
                type: Number,
                required: true,
                default: 1
            }
        }
    ],
    status: {
        type: String,
        enum: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"],
        default: "Pending"
    },
    totalPrice: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;