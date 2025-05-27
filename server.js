import express from "express";
import dotenv from "dotenv"; 
import connectDB from "./config/Database.js"
import authRoutes from "./routers/authRouters.js"
import authAdminRoutes from "./routers/authAdminRouters.js"
import cookieParser from "cookie-parser"; 
import foodRoutes from "./routers/foodsRouter.js";
import profileRoutes from "./routers/profileRouters.js";
import orderRoutes from "./routers/orderRouter.js";
import collegeRouters from "./routers/collegeRouters.js"

dotenv.config();
const app = express();


//MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

//ROUTERS
app.use("/api/v1/users",authRoutes);
app.use("/api/v1/admin",authAdminRoutes);
app.use("/api/v1/foods",foodRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/orders",orderRoutes);
app.use("/api/v1/college",collegeRouters);


//PORT 
const port = process.env.PORT || 3000;
app.listen(port ,(req,res)=>{
    console.log(`Serrver successfully Connected http://localhost:${port}`)
    try {
        connectDB();
    } catch (error) {
        console.log("Database connection get failed",error)
    }
});