import foodModel from "../models/foodModel.js";
import cloudinary from "../utils/cloudinary.js"

export const createFoodItem = async (req, res) => {
    try {
        const { foodName, foodPrice, foodImage, foodCategory, foodDescription, isVeg } = req.body;
        if (!foodName || !foodCategory || !foodPrice || !foodDescription || isVeg === undefined ) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        // if (!req.file) {
        //     return res.status(400).json({ message: "Image file is required" });
        // }

        const existingFood = await foodModel.findOne({ foodName });
        if (existingFood) {
            return res.status(400).json({ message: "Food Already Existed" });
        }

        // const result = await cloudinary.uploader.upload(req.file.path, {
        //     folder: "food_images",
        // });

        const newFood = new foodModel({
            foodName,
            foodPrice,
           // foodImage: result.secure_url,
            foodCategory,
            foodDescription,
            isVeg
        })
        await newFood.save();
        res.status(201).json({ message: "Food CREATED SUCCESSFULLY", food: newFood });
    } catch (error) {
        console.error("Error creating food item:", error);
        res.status(500).json({ message: "Internal server error" });

    }
}

export const getFoodMenu = async (req, res) => {
    try {
        const foods = await foodModel.find();
        if (foods.length === 0) {
            return res.status(404).json({ message: "No food items found" });
        }

        const foodMenu = foods.map((food) => {
            const { foodName, foodPrice, foodImage, foodCategory, foodDescription, isVeg } = food;
            return {
                 _id: food._id,
                foodName,
                foodPrice,
                foodImage,
                foodCategory,
                foodDescription,
                isVeg
            };
        });

        return res.status(200).json({
            message: "Food menu fetched successfully",
            foodMenu
        });

    } catch (error) {
        console.error("Error fetching food menu:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// export const addFoodItem = async (req, res) => {
//     try {
//         const { foodName, foodPrice, foodImage, foodCategory, foodDescription, isVeg } = req.body;

//         if (!foodName || !foodCategory || !foodPrice) {
//             return res.status(400).json({ message: "Please fill all the fields" });
//         }

//         const existingFood = await foodModel.findOne({ foodName });
//         if (existingFood) {
//             return res.status(400).json({ message: "Food item already in the menu" })
//         }

//         const newFood = new foodModel({
//             foodName,
//             foodPrice,
//             foodImage,
//             foodCategory, foodDescription,
//             isVeg
//         })

//         await newFood.save();
//         res.status(201).json({ message: "Food item added successfully", food: newFood });

//     } catch (error) {
//         console.error("Error adding food item:", error);
//         res.status(500).json({ message: "Internal server error on adding foods to menu" });

//     }
// }

export const updateFoodItem = async (req, res) => {

    try {
        const{role,_id: adminId,adminName  } = req.admin;
        if (role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Please provide id" });
        }
        const { foodName, foodPrice, foodImage, foodCategory, foodDescription, isVeg } = req.body;
        const updatedFood = await foodModel.findByIdAndUpdate(id, {
            foodName,
            foodPrice,
            foodImage,
            foodCategory,
            foodDescription,
            isVeg,
            updatedBy: adminId   

        }, { new: true });

        if (!updatedFood) {
            return res.status(404).json({ message: "Food item not found" });
        }

        res.status(200).json({ message: "Food item updated successfully", Food: updatedFood, adminName: adminName });

    } catch (error) {
        console.error("Error updating food item:", error);
        res.status(500).json({ message: "Internal server error on updating food item" });

    }
}

export const deleteFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(404).json({ message: "Please provide id" });
        }

        const deletedFood = await foodModel.findByIdAndDelete(id);
        if (!deletedFood) {
            return res.status(404).json({ message: "Food item not found" });
        }
        return res.status(200).json({ message: "Food item deleted successfully", Food: deletedFood });
    } catch (error) {
        console.error("Error deleting food item:", error);
        res.status(500).json({ message: "Internal server error on deleting food item" });

    }
}

export const getAllFoodItems = async (req, res) => {
    try {
        const foods = await foodModel.find();
        if (foods.length === 0) {
            return res.status(404).json({ message: "No food items found" });
        }        
        res.status(200).json({ message: "All food items fetched successfully", foods });
    } catch (error) {
        console.error("Error fetching all food items:", error);
        res.status(500).json({ message: "Internal server error on fetching all food items" });

    }
}

export const getSingleFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Please provide id" });
        }
        const food = await foodModel.findById(id);

        if (!food) {
            return res.status(404).json({ message: "Food item not found" });
        }
        return res.status(200).json({ message: "Get that food successfully", Food: food })
    } catch (error) {
        console.error("Error fetching single food item:", error);
        res.status(500).json({ message: "Internal server error on fetching single food item" });

    }
}





