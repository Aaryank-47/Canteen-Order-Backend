import foodModel from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";
import cloudinary from "../utils/cloudinary.js"

export const createFoodItem = async (req, res) => {
    try {
        const { foodName, foodPrice, foodCategory, foodDescription } = req.body;
        const isVeg = req.body.isVeg === "true" || req.body.isVeg === true;
        // const { foodName, foodPrice, foodImage, foodCategory, foodDescription, isVeg } = req.body;
        // isVeg = isVeg === "true" || isVeg === true;
        if (!foodName || !foodCategory || !foodPrice || !foodDescription || typeof isVeg !== "boolean") {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Image file is required" });
        }
        console.log('Received file:', req.file);
        console.log('Received body:', req.body);
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
            foodImage: req.file.path,
            foodCategory,
            foodDescription,
            isVeg
        })
        await newFood.save();
        res.status(201).json({ message: "Food CREATED SUCCESSFULLY", food: newFood });
    } catch (error) {
        console.error("Error creating food item:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });

    }
}


export const updateFoodItem = async (req, res) => {

    try {
        const { role, _id: adminId, adminName } = req.admin;
        if (role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Please provide id" });
        }

        const updateData = { updatedBy: adminId };

        // 👇 Type converters based on schema requirements
        const typeConverters = {
            isVeg: val => val === "true" || val === true,
            foodPrice: val => Number(val),
        };

        const allowedFields = ["foodName", "foodPrice", "foodCategory", "foodDescription", "isVeg"];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                const convert = typeConverters[field];
                const convertedValue = convert ? convert(req.body[field]) : req.body[field];

                if (field === "foodPrice" && isNaN(convertedValue)) {
                    return res.status(400).json({ message: "Invalid foodPrice: must be a valid number" });
                }

                updateData[field] = convertedValue;
            }
        }

        console.log("Received body", req.body);



        // 👇 If image is provided (optional), include it
        if (req.file && req.file.path) {
            updateData.foodImage = req.file.path;
        }

        const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedFood) {
            return res.status(404).json({ message: "Food item not found" });
        }

        // let { foodName, foodPrice, foodCategory, foodDescription, isVeg } = req.body;
        // isVeg = isVeg === "true" || isVeg === true;
        // // If a new image file was uploaded, req.file.path is the new Cloudinary URL.
        // // Otherwise, use the existing image URL sent via req.body or from your database.
        // // const foodImageUrl = req.file ? req.file.path : req.body.foodImage;

        // // if(!foodImageUrl){
        // //     console.log("Image file is required")
        // //     return res.status(400).json({ message: "Image file is required" });
        // // }
        // if(!req.file){
        //     console.log("Image file is required")
        //     return res.status(400).json({ message: "Image file is required" });
        // }
        // console.log('Received file:', req.file); 
        // console.log('Received body:', req.body);

        // const updatedFood = await foodModel.findByIdAndUpdate(id, {
        //     foodName,
        //     foodPrice,
        //     foodImage: req.file.path,
        //     foodCategory,
        //     foodDescription,
        //     isVeg,
        //     updatedBy: adminId

        // }, { new: true });

        // if (!updatedFood) {
        //     return res.status(404).json({ message: "Food item not found" });
        // }

        res.status(200).json({ message: "Food item updated successfully", Food: updatedFood, adminName: adminName });

    } catch (error) {
        console.error("Error updating food item:", error);
        res.status(500).json({ message: "Internal server error on updating food item" });

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
        res.status(200).json({
            message: "All food items fetched successfully",
            foodslist: foods,

        });
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


export const topSellingFood = async (req, res) => {
  try {
    const foodCountMap = {};
    const orders = await orderModel.find({
      status: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"],
    });

    console.log("Orders fetched for top selling food:", orders.length);

    const fo = orders.forEach((order) => {
      order.foodItems.forEach((item) => {
        const foodId = item.foodId.toString();
        const quantity = item.foodQuantity || 1;
        foodCountMap[foodId] = (foodCountMap[foodId] || 0) + quantity;
      });
    });

    console.log("Food count map:", foodCountMap);
    console.log("FO : ", fo)

    const sortedFoodIds = Object.entries(foodCountMap)
      .map(([foodId, quantity]) => ({ foodId, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log("sortedFoodIds : ", sortedFoodIds);

    const populatedFoods = await Promise.all(
      sortedFoodIds.map(async ({ foodId, quantity }) => {
        const food = await foodModel.findById(foodId).lean();
        return {
          foodId,
          quantity,
          foodName: food?.foodName || "Unknown",
        };
      })
    );

    const tsf = sortedFoodIds.map((item) => item.foodId);
    console.log("Top selling food IDs:", tsf);
    console.log("Populated foods:", populatedFoods);


    res.status(200).json({
      message: "Top selling food items fetched successfully",
      topSellingFoodIds: tsf,
      populatedFoods,
    });
  } catch (error) {
    console.error("Error fetching top selling food:", error);
    res
      .status(500)
      .json({ message: "Internal server error on fetching top selling food" });
  }
};

// export const topSellingFood = async (req, res) => {
//     try {

//         const foodCountMap = {};
//         const orders = await orderModel.find({ status:  ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] })

//         orders.map((order) => {
//             order.foodItems.map((item) => {
//                 const foodId = item.foodId.toString();
//                 const quantity = item.foodQuantity || 1; // Default to 1 if not specified
//                 if (foodCountMap[foodId]) {
//                     foodCountMap[foodId] += quantity;
//                 }
//                 else {
//                     foodCountMap[foodId] = quantity;
//                 }
//             })
//         })

//         // Convert the foodCountMap to an array of objects with foodId and quantity
//         const sortedFoodIds = Object.entries(foodCountMap).map(([foodId, quantity]) => ({ foodId, quantity }))

//         // Sort the array by quantity in descending order
//         sortedFoodIds.sort((a, b) => b.quantity - a.quantity);

//         // Get the top 5 selling food items
//         const topSellingFoodIds = sortedFoodIds.slice(0, 5).map(item => item.foodId);

//         if (topSellingFoodIds.length === 0) {
//             return res.status(404).json({ message: "No top selling food items found" });
//         }

//         const populatedFoods = await Promise.all(topSellingFoodIds.map(async (item) => {
//             const food = await foodModel.findById(item.foodId).lean();
//             return {
//                 ...item,
//                 foodName: food?.foodName,
//                 // foodImage: food?.foodImage
//             };
//         }));


//         console.log("Top selling food IDs:", topSellingFoodIds);
//         res.status(200).json({
//             message: "Top selling food items fetched successfully",
//             topSellingFoodIds,
//             populatedFoods

//         });

//     } catch (error) {
        
//         console.error("Error fetching top selling food:", error);
//         res.status(500).json({ message: "Internal server error on fetching top selling food" });

//     }
// }




