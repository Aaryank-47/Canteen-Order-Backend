import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config({path: './config/.env'});

const connectDB = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI );
        console.log(`Database Successfully connected.`);
    } catch (error) {
        console.log("Error in database connection",error);
    }
}

export default connectDB; 


