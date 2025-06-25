import collegeModel from '../models/collegeModels.js';
import { generateCollegeAuthToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import adminModel from '../models/adminModel.js';

export const registration = async (req, res) => {
    try {
        const { collegeName, collegeEmail, collegePassword, collegeAddress, collegeCode } = req.body;

        if (!collegeName || !collegeEmail || !collegePassword || !collegeAddress || !collegeCode) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        const collegeExists = await collegeModel.findOne({ collegeCode });
        if (collegeExists) {
            return res.status(400).json({ message: "College already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(collegePassword, salt);

        try {

            const collegeCreated = await collegeModel.create({
                collegeName,
                collegeCode,
                collegeAddress,
                collegeEmail,
                collegePassword: hashPassword
            })

            if (!collegeCreated) {
                return res.status(400).json({ message: "Error in creating college" });
            }

            const collegeToken = await generateCollegeAuthToken(collegeCreated);
            if (!collegeToken) {
                return res.status(400).json({ message: "Error in generating token" });
            }

            res.cookie("collegeToken", collegeToken, {
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: false,
                sameSite: "lax"
            }).status(201).json({
                message: "College created successfully",
                collegeId: collegeCreated._id.toString(),
                collegeToken
            });

            console.log("collegeToken via college registration:", collegeToken);
            console.log("cookies via college registration -> req.cookies.collegeToken:", req.cookies.collegeToken);

        } catch (error) {
            console.log(error);
            return res.status(500).json({ 'error': error });

        }
    } catch (error) {
        res.status(500).json({ "internal server error": error });
    }
}


export const login = async (req, res) => {
    try {
        try {
            const { collegeEmail, collegePassword, collegeCode } = req.body;
            if (!collegeEmail || !collegePassword || !collegeCode) {
                return res.status(400).json({ message: "Please fill all fields" });
            }

            const collegeExists = await collegeModel.findOne({ collegeEmail, collegeCode }).select("+collegePassword");
            if (!collegeExists) {
                return res.status(400).json({ message: "College not found" });
            }

            const isPasswordMatch = await bcrypt.compare(collegePassword, collegeExists.collegePassword);
            if (!isPasswordMatch) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const collegeToken = await generateCollegeAuthToken(collegeExists);
            if (!collegeToken) {
                return res.status(400).json({ message: "Error in generating token" });
            }
            res.cookie("collegeToken", collegeToken, {
                expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: false,
                sameSite: "lax"
            }).status(200).json({
                message: "Login successful",
                collegeId: collegeExists._id.toString(),
                collegeToken: collegeToken
            })

            console.log("collegeToken:", collegeToken);
            console.log("req.cookies via login : ", req.cookies);
            console.log("cookies via college login -> req.cookies.collegeToken:", req.cookies.collegeToken);

        } catch (error) {
            console.log(error);
            return res.status(500).json({ "error": error });

        }
    } catch (error) {
        res.status(500).json({ "internal server error on login of the college": error });

    }
}

export const logout = async (req, res) => {
    try {

        res.clearCookie("collegeToken", {
            httpOnly: true,
            expires: new Date(Date.now()),
            secure: false,
            sameSite: "none"
        }).status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        res.status(500).json({ "internal server error on logout of the college": error });
    }
}


export const getAllColleges = async (req, res) => {
    try {
        const colleges = await collegeModel.find();
        if (!colleges) {
            return res.status(400).json({ message: "No colleges found" });
        }
        res.status(200).json({
            message: "Colleges found",
            colleges
        })
    } catch (error) {
        res.status(500).json({ "internal server error on getting all colleges": error });

    }
}

export const getsingleCollege = async (req, res) => {
    try {
        const { college_id } = req.params;
        if (!college_id) {
            return res.status(400).json({ message: "Please provide college id" });
        }

        const college = await collegeModel.find({ _id: college_id });
        if (!college) {
            return res.status(400).json({ message: "No college found" });
        }

        res.status(200).json({
            message: "College found",
            college: college
        })

    } catch (error) {
        res.status(500).json({ "internal server error on getting single college": error });

    }
}

export const deleteCollege = async (req, res) => {
    try {
        const { college_id } = req.params;
        if (!college_id) {
            return res.status(400).json({ message: "Please provide college id" });
        }

        const deleteCollege = await collegeModel.findByIdAndDelete(college_id);
        if (!deleteCollege) {
            return res.status(400).json({ message: "No college found" });
        }

        res.status(200).json({
            message: "College deleted successfully",
            college: deleteCollege
        })
    } catch (error) {
        res.status(500).json({ "internal server error on deleting college": error });
    }
}

export const addCollegeCanteens = async (req, res) => {
    try {
        const { adminIds } = req.body;
        const { collegeId } = req.params;

        const existingCollege = await collegeModel.findById(collegeId);
        if (!existingCollege) {
            return res.status(404).json({ message: "College not found" });
        }

        if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
            return res.status(400).json({ message: "Please provide adminId (canteen ID)" });
        }

        const canteens = await adminModel.find({ _id: { $in: adminIds } });
        if (canteens.length !== adminIds.length) {
            return res.status(404).json({ message: "Some canteens not found" });
        }

        const updatedCollege = await collegeModel.findByIdAndUpdate(
            collegeId,
            { $addToSet: { canteens: { $each: adminIds } } },
            { new: true }
        ).populate("canteens", "-password");

        res.status(200).json({
            message: "Canteen added to college successfully",
            college: updatedCollege
        });

    } catch (error) {
        console.error("Error adding college canteens:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


export const getSelectedCanteens = async (req, res) => {
    try {
        const { collegeId } = req.params;

        const college = await collegeModel.findById(collegeId).populate("canteens", "-adminPassword -__v");

        if (!college) {
            return res.status(404).json({
                success: false,
                message: "College not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Selected canteens fetched successfully",
            selectedCanteens: college.canteens
        });
    } catch (error) {
        console.error("Error fetching selected canteens:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// export const getCollegeCanteens = async (req, res) => {
//     try {
//         const { college, role } = req.user;
        
//         if (!college) {

//             console.error("User college information not found");

//             return res.status(400).json({
//                 message: "User college information not found",
//                 suggestion: "Complete your profile or contact support"
//             });
//         }

        
//         const collegeCanteens = await adminModel.find({
//             collegeId: college._id,
//             role: "admin"
//         }).select("adminName");
        
        
//         if (collegeCanteens.length === 0) {
//             return res.status(404).json({ message: "No canteens found for this college" });
//         }
        
        
//         return res.status(200).json({
//             success: true,
//             count: collegeCanteens.length,
//             canteens: collegeCanteens
//         });
    
//     } catch (error) {
//         console.error("Error fetching college canteens:", error);
//         res.status(500).json({ message: "Internal server error on fetching college canteens" });

//     }
// }