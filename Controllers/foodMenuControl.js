import foodModel from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";
import adminModel from "../models/adminModel.js";

export const createFoodItem = async (req, res) => {

    const adminId = req.admin._id;
    if (!adminId) {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    console.log("Admin ID:", adminId);

    try {
        const { foodName, foodPrice, foodCategory, foodDescription } = req.body;
        const isVeg = req.body.isVeg === "true" || req.body.isVeg === true;
        const isActive = req.body.isActive === "true" || req.body.isActive === true;

        if (!foodName || !foodCategory || !foodPrice || !foodDescription || typeof isVeg !== "boolean" || typeof isActive !== "boolean") {
            console.log("Missing required fields", { foodName, foodCategory, foodPrice, foodDescription, isVeg, isActive, foodImage, adminId });
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Image file is required" });
        }
        console.log('Received file:', req.file);
        console.log('Received body:', req.body);

        const existingFood = await foodModel.findOne({
            foodName,
            adminId
        });

        if (existingFood) {
            console.log("Food already exists:", existingFood);
            return res.status(400).json({ message: "Food Already Existed" });
        }



        const newFood = new foodModel({
            foodName,
            foodPrice,
            foodImage: req.file.path,
            foodCategory,
            foodDescription,
            isVeg,
            isActive: true,
            adminId
        })

        await newFood.save();
        console.log("New food item created:", newFood);

        res.status(201).json({
            message: "Food CREATED SUCCESSFULLY",
            food: newFood
        });

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
        const adminId = req.admin._id;
        const { id } = req.params;

        if (!adminId) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        console.log("Admin ID:", adminId);

        if (!id) {
            return res.status(400).json({ message: "Please provide id" });
        }

        const updateData = {
            updatedBy: adminId,
            updatedAt: Date.now()
        };
        // 👇 Type converters based on schema requirements
        const typeConverters = {
            isVeg: val => val === "true" || val === true,
            isActive: val => val === "true" || val === true,
            foodPrice: val => Number(val),
        };

        const allowedFields = ["foodName", "foodPrice", "foodCategory", "foodDescription", "isVeg", "isActive"];

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

        // const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true });

        const updatedFood = await foodModel.findOneAndUpdate(
            { _id: id, adminId },
            updateData,
            { new: true }
        );

        if (!updatedFood) {
            console.log("Food item not found for update:", id);
            return res.status(404).json({ message: "Food item not found" });
        }
        console.log("Updated food item:", updatedFood);


        return res.status(200).json({
            message: "Food item updated successfully",
            food: updatedFood
        });

    } catch (error) {
        console.error("Error updating food item:", error);
        res.status(500).json({ message: "Internal server error on updating food item" });

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
}




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
        const adminId = req.admin._id;

        if (!id) {
            return res.status(404).json({ message: "Please provide id" });
        }

        // const deletedFood = await foodModel.findByIdAndDelete(id);
        const deletedFood = await foodModel.findOneAndDelete({
            _id: id,
            adminId
        });

        if (!deletedFood) {
            return res.status(404).json({ message: "Food item not found" });
        }

        return res.status(200).json({
            message: "Food item deleted successfully",
            Food: deletedFood
        });

    } catch (error) {

        console.error("Error deleting food item:", error);
        res.status(500).json({
            message: "Internal server error on deleting food item",
            error: error.message
        });

    }
}

// -------------- GET ALL FOOD ITEMS -------------------

export const getAllFoodItems = async (req, res) => {
    try {
        const foods = await foodModel.find();
        if (foods.length === 0) {
            return res.status(404).json({ message: "No food items found" });
        }

        const foodMenu = foods.map((food) => {
            const { foodName, foodPrice, foodImage, foodCategory, foodDescription, isVeg, isActive } = food;
            return {
                _id: food._id,
                foodName,
                foodPrice,
                foodImage,
                foodCategory,
                foodDescription,
                isVeg,
                isAvailable: isActive
            };
        });

        return res.status(200).json({
            success: true,
            message: "Food menu fetched successfully",
            foodMenu: foodMenu
        });

    } catch (error) {
        console.error("Error fetching food menu:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// ------------------ GET FOOD MENU --------------------------


export const getFoodMenu = async (req, res) => {
    try {
        const { adminId } = req.params; // ✅ Correct

        if (!adminId) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        console.log("Admin ID:", adminId);


        const foods = await foodModel.find({ adminId }).select('-__v -updatedBy -createdAt -updatedAt');
        if (foods.length === 0) {
            return res.status(200).json({ 
                message: "No food items found" 
            });
        }
        return res.status(200).json({
            message: "All food items fetched successfully",
            foodslist: foods,

        });
    } catch (error) {

        console.error("Error fetching all food items:", error.message);
        res.status(500).json({ message: "Internal server error on fetching all food items" });

    }
}

// ------------------ TOGGLE ACTIVE STATE --------------------------

export const toggleActiveVal = async (req, res) =>{
    try {
        const {id} = req.params;
        const { isActive } = req.body;

        if(!id){
            console.log("Not getting adminId");
        }
        console.log(id);

        const updateFood = await foodModel.findByIdAndUpdate(
            id,
            {isActive},
            {new: true}
        );

        if(!updateFood){
            console.log("Food item not found");
        }
        console.log(updateFood);

        return res.status(200).json({
            success: true,
            message: "Availability status updated",
            food: updateFood
        })

    } catch (error) {
        console.log("Internal Server error in toggling the actrive state of food");
        return res.status(400).json({
            success: false,
            message: "Internal Server error in toggling the actrive state of food"
        })
    }
}


// ------------------ GET SINGLE FOOD ITEM --------------------------


export const getSingleFoodItem = async (req, res) => {
    try {
        const adminId = req.admin._id;
        const { id } = req.params;

        if (!adminId) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        console.log("Admin ID:", adminId);

        if (!id) {
            return res.status(400).json({ message: "Please provide id" });
        }
        console.log("Food ID:", id);

        const food = await foodModel.findOne({
            _id: id,
            adminId
        });

        if (!food) {
            return res.status(404).json({ message: "Food item not found" });
        }

        return res.status(200).json({
            message: "Get that food successfully",
            Food: food
        });


    } catch (error) {

        console.error("Error fetching single food item:", error);
        res.status(500).json({
            message: "Internal server error on fetching single food item",
            error: error.message
        });

    }
}


// ---------------------- GET TOP SELLING FOOD ------------------------


export const topSellingFood = async (req, res) => {
    try {

        const adminId = req.admin._id;
        if (!adminId) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        console.log("Admin ID:", adminId);

        const foodCountMap = {};
        const orders = await orderModel.find({
            canteen: adminId,
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
                const food = await foodModel.findOne({
                    _id: foodId,
                    adminId
                }).lean();

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






export const getCanteenMenu = async (req, res) => {
    try {
        const { role, _id: requestingAdminId } = req.admin;
        const { adminId: targetAdminId } = req.params;

        if (role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const targetAdmin = await adminModel.findById(targetAdminId);
        if (!targetAdmin || targetAdmin.role !== "admin") {
            return res.status(404).json({ message: "Canteen not found" });
        }


        const menu = await foodModel.find({
            canteen: adminId,
            isActive: true
        }).select('--v');

        // if (menu.length === 0) {
        //     return res.status(200).json({ message: "No food items found in canteen menu" });
        // }

        res.status(200).json({
            success: true,
            canteenName: targetAdmin.canteenName,
            // openingHours: `${targetAdmin.openingTime} - ${targetAdmin.closingTime}`,
            menuItems: menu,
            count: menu.length
        });

    } catch (error) {
        console.error("Error fetching canteen menu:", error);
        res.status(500).json({ message: "Internal server error on fetching canteen menu" });

    }
}
