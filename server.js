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
import cors from "cors";
dotenv.config();
const app = express();

//CORS
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204 
};

//MIDDLEWARES
app.use(cors(corsOptions));       
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


// COOP Header Middleware
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});





//ROUTERS
app.use("/api/v1/users",authRoutes);
app.use("/api/v1/admin",authAdminRoutes);
app.use("/api/v1/foods",foodRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/orders",orderRoutes);
app.use("/api/v1/college",collegeRouters);


//PORT 
const port = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server successfully connected at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to the database:", error);
  });
// app.listen(port ,(req,res)=>{
//     console.log(`Serrver successfully Connected http://localhost:${port}`)
//     try {
//         connectDB();
//     } catch (error) {
//         console.log("Database connection get failed",error)
//     }
// });