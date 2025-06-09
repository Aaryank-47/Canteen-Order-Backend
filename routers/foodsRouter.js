import { getFoodMenu, createFoodItem, updateFoodItem, deleteFoodItem, getAllFoodItems, getSingleFoodItem } from "../Controllers/foodMenuControl.js";
import express from "express";
// import {adminMiddleware} from "../middleware/adminMiddleware.js";
import upload from "../middleware/multer.middleware.js"
const router = express.Router();

router.route("/create").post(upload.single("foodImage"), createFoodItem);
router.route("/menu").get(getFoodMenu);
//router.route("/add").post(addFoodItem);
// router.route("/update/:id").put(adminMiddleware,upload.single("foodImage"), updateFoodItem);
router.route("/update/:id").put(upload.single("foodImage"), updateFoodItem);
// router.route("/delete/:id").delete(adminMiddleware,deleteFoodItem);
router.route("/delete/:id").delete(deleteFoodItem);
router.route("/").get(getAllFoodItems);
router.route("/:id").get(getSingleFoodItem);




export default router;
