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
dotenv.config({path: './config/.env'});
const app = express();

//CORS
const corsOptions = {
  origin: [process.env.URL1, process.env.URL2, process.env.URL3, process.env.URL4, process.env.URL5],
  // origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
  exposedHeaders: ['set-cookie']
};

// console.log("Allowed origins:", process.env.URL1, process.env.URL2);
console.log("Allowed origins: ",[
  process.env.URL1,
  process.env.URL2,
  process.env.URL3,
  process.env.URL4,
  process.env.URL5
]);



//MIDDLEWARES
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({
  type: (req) => { return !req.originalUrl.includes('/api/v1/foods/create') && !req.originalUrl.includes('/api/v1/foods/update/') }
}));
app.use(express.urlencoded({
  extended: true,
  type: (req) => { return !req.originalUrl.includes('/api/v1/foods/create') && !req.originalUrl.includes('/api/v1/foods/update/') }
}));


// COOP Header Middleware
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});





//ROUTERS
app.use("/api/v1/foods", foodRoutes);
app.use("/api/v1/users", authRoutes);
app.use("/api/v1/admin", authAdminRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/colleges", collegeRouters);


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