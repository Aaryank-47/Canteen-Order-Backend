import  mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    // collegeId:{
    //     type: mongoose.SchemaTypes.ObjectId,
    //     ref: 'College'
    // },
    orderNumber:{
        type: Number
    },
    foodItems:[
        {
            foodId:{
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'Food'
            },
            foodQuantity:{
                type: Number,
                default: 1
            }
        }
    ],
    status:{
        type: String,
        enum: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"],
        default: "Pending"
    },
    totalPrice:{
        type: Number,
        default: 0
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
},{
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;