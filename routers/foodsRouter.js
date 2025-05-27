import { getFoodMenu, createFoodItem, updateFoodItem, deleteFoodItem, getAllFoodItems, getSingleFoodItem } from "../Controllers/foodMenuControl.js";
import express from "express";
import {adminMiddleware} from "../middleware/adminMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.route("/create").post(adminMiddleware, createFoodItem);
router.route("/menu").get(getFoodMenu);
//router.route("/add").post(addFoodItem);
router.route("/update/:id").put(adminMiddleware,updateFoodItem);
router.route("/delete/:id").delete(adminMiddleware,deleteFoodItem);
router.route("/").get(authMiddleware,getAllFoodItems);
router.route("/:id").get(getSingleFoodItem);




export default router;
