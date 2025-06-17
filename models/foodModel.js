import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
    foodName: {
        type: String,
        trim: true
    },
    foodPrice: {
        type: Number,
        // min: 0
    },
    foodImage: {
        type: String,
        default: "https://image.similarpng.com/very-thumbnail/2021/09/Good-food-logo-design-on-transparent-background-PNG.png",
    },
    foodDescription: {
        type: String,
    },
    isVeg: {
        type: Boolean,
    },
    foodCategory: {
        type: String,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
})

const Food = mongoose.model('Food', foodSchema);
export default Food;