import { getFoodMenu, createFoodItem, updateFoodItem, deleteFoodItem, getAllFoodItems, getSingleFoodItem, topSellingFood } from "../Controllers/foodMenuControl.js";
import express from "express";
import {adminMiddleware} from "../middleware/adminMiddleware.js";
import upload from "../middleware/multer.middleware.js"
const router = express.Router();

router.route("/create").post(adminMiddleware,upload.single("foodImage"), createFoodItem);
router.route("/update/:id").put(adminMiddleware,upload.single("foodImage"), updateFoodItem);
router.route("/delete/:id").delete(adminMiddleware,deleteFoodItem);
router.route("/top-selling-food").get(adminMiddleware,topSellingFood);
router.route("/:id").get(adminMiddleware,getSingleFoodItem);

router.route("/canteens-menu/:adminId").get(getFoodMenu);
router.route("/").get(getAllFoodItems);


export default router;
