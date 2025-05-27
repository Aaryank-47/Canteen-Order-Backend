import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
    foodName: {
        type: String,
        // required: true,
        trim: true
    },
    foodPrice: {
        type: Number,
        // required: true,
        min: 0
    },
    foodImage: {
        type: String,
        /// required: true,
        default: "https://image.similarpng.com/very-thumbnail/2021/09/Good-food-logo-design-on-transparent-background-PNG.png",
    },
    foodDescription: {
        type: String,
        // required: true
    },
    isVeg: {
        type: Boolean,
        // required: true
    },
    foodCategory: {
        type: String,
        // required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
})

const Food = mongoose.model('Food', foodSchema);
export default Food;