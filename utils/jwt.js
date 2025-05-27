import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: "./config/.env" });

const jwt_secret = process.env.JWT_SK
const jwt_college_secret = process.env.COLLEGE_JWT_SK;

export const generateToken = (user) => {
    try {
        return jwt.sign(
            { userId: user._id.toString(), email: user.email },
            jwt_secret,
            { expiresIn: '5d' }
        );
    } catch (error) {
        console.log(error);
    }
}

export const generateCollegeAuthToken= (college) => {
    try {
        return jwt.sign(
            {collegeId: college._id.toString(), collegeEmail: college.collegeEmail},
            jwt_college_secret,
            { expiresIn: '5d' }
        )
    } catch (error) {
        console.log(error);
        
    }
};


export const generateAdminToken = (admin) =>{
    try {
        return jwt.sign(
            { adminId: admin._id.toString(), email: admin.email },
            jwt_secret,
            { expiresIn: '5d' }
        );
    } catch (error) {
        console.log(error);
        
    }
}