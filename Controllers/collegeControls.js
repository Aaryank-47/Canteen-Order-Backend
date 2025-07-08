import collegeModel from '../models/collegeModels.js';
import { generateCollegeAuthToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import adminModel from '../models/adminModel.js';
import mongoose from 'mongoose';

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
                // secure: process.env.NODE_ENV === "production",
                sameSite: "None"
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
                // secure: process.env.NODE_ENV === "production",
                sameSite: "None"
            }).status(200).json({
                message: "Login successful",
                college: {
                    collegeId: collegeExists._id.toString(),
                    collegeName: collegeExists.collegeName,
                    collegeEmail: collegeExists.collegeEmail
                },
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
        res.cookie("collegeToken", null,{
            httpOnly: true,
            expires: new Date(Date.now()),
            secure: false,
            // secure: process.env.NODE_ENV === "production",
            sameSite: "None"
        }).status(200).json({ 
            message: "Logged out successfully",
            collegeToken: null
        });
        console.log("Cookie has been cleared successfully");

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

        console.log("collegeId : ", collegeId);

        if (!collegeId || collegeId === "null" || !mongoose.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: "collegeId is missing or invalid" });
        }

        if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
            return res.status(400).json({ message: "Please provide adminId (canteen ID)" });
        }

        const college = await collegeModel.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }

        const canteens = await adminModel.find({ _id: { $in: adminIds } });
        if (canteens.length !== adminIds.length) {
            return res.status(404).json({ message: "Some canteens not found" });
        }

        //  Update both collections in a transaction
        // const session = await mongoose.startSession();
        // session.startTransaction();

        // Prepare transaction-like behavior without actual transactions
        let updatedCollege;
        try {
            // 1. Update college's canteens array
            updatedCollege = await collegeModel.findByIdAndUpdate(
                collegeId,
                { $addToSet: { canteens: { $each: adminIds } } },
                { new: true }
            ).populate("canteens", "adminName");

            console.log("updatedCollege : ", updatedCollege)

            // 2. Update each canteen's college reference
            const addedCanteens = await adminModel.updateMany(
                { _id: { $in: adminIds } },
                {
                    $set: {
                        collegeId: collegeId,
                        collegeName: college.collegeName
                    }
                }
            );

            console.log("addedCanteens : ", addedCanteens)

            res.status(200).json({
                message: "Canteen added to college successfully",
                college: updatedCollege,
                canteens_added: addedCanteens
            });

        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            // throw error;
            // Manual rollback if second operation fails
            if (updatedCollege) {
                await collegeModel.findByIdAndUpdate(
                    collegeId,
                    { $pull: { canteens: { $in: adminIds } } }
                );
            }
            throw error;
        }

    } catch (error) {
        console.error("Error adding college canteens:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


// export const getAddedCanteens = async (req, res) => {
//     try {
//         const { collegeId } = req.params;

//         const college = await collegeModel.findById(collegeId).populate("admins", "-adminPassword -__v");

//         if (!college) {
//             return res.status(404).json({
//                 success: false,
//                 message: "College not found"
//             });
//         }

//         console.log("added canteens:", college.admins);

//         return res.status(200).json({
//             success: true,
//             message: "Selected canteens fetched successfully",
//             selectedCanteens: college.admins
//         });
//     } catch (error) {
//         console.error("Error fetching selected canteens:", error);
//         return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//     }
// };

export const getCollegeCanteens = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { college: userCollege, role } = req.user || {};

        let college;

        if (collegeId) {
            college = await collegeModel.findById(collegeId);
        } else if (userCollege) {
            college = await collegeModel.findOne({ collegeName: userCollege });
        } else {
            return res.status(400).json({
                message: "College information missing",
                suggestion: "Pass collegeId in params or ensure user is logged in with college"
            })
        }

        console.log("User college:", college);

        if (!college) {
            console.error("User college information not found");

            return res.status(400).json({
                message: "User college information not found",
                suggestion: "Complete your profile or contact support"
            });
        }

        const collegeCanteens = await collegeModel.findById(college._id)
            .populate({
                path: "canteens",
                select: "adminName _id"
            });


        console.log("college id:", college._id);
        console.log("collegeCanteens:", collegeCanteens);

        // Transform the data to only include names and IDs
        const canteenNames = collegeCanteens.canteens.map(canteen => ({
            name: canteen.adminName,
            id: canteen._id
        }));

        console.log("canteenNames:", canteenNames);

        if (!collegeCanteens?.canteens?.length) {
            console.error("No canteens found for this college");
            return res.status(404).json({ message: "No canteens found for this college" });
        }


        return res.status(200).json({
            success: true,
            count: canteenNames.length,
            canteens: canteenNames
        });

    } catch (error) {
        console.error("Error fetching college canteens:", error);
        res.status(500).json({ message: "Internal server error on fetching college canteens" });

    }
}

export const removeCollegeCanteen = async (req, res) => {

    // const session = await mongoose.startsession()
    // session.startTransaction();

    try {
        const { collegeId } = req.params;
        const { adminId } = req.body;

        if (!collegeId || !adminId) {
            // await session.abortTransaction();
            return res.status(400).json({
                message: "Please provide collegeId and adminId"
            });
        }

        const college = await collegeModel.findById(collegeId);
        if (!college) {
            console.log(`That particular college with ${collegeId} doesn't exist`);

            return res.status(404).json({
                message: `Canteen with ID ${adminId} not found`
            });
        }

        const canteen = await adminModel.findById(adminId);
        if (!canteen) {
            console.log('That particular canteen doesnot exist');
            return res.status(400).json({
                message: `Canteen with ID ${adminId} not found`
            })
        }

        console.log("collegeId:", collegeId);
        console.log("adminId:", adminId);

        // Check if canteen exists in college's canteens array
        if (!college.canteens.includes(adminId)) {
            return res.status(404).json({ message: "Canteen not associated with this college" });
        }


        let updatedCollege;
        try {
            // 1. Remove from college
            updatedCollege = await collegeModel.findByIdAndUpdate(
                collegeId,
                { $pull: { canteens: adminId } },
                { new: true }
            );

            // 2. Remove college reference from canteen
            await adminModel.findByIdAndUpdate(
                adminId,
                {
                    $unset: {
                        collegeId: "",
                        collegeName: ""
                    }
                }
            );

            return res.status(200).json({
                success: true,
                message: `${canteen.adminName} removed successfully from ${college.collegeName}`,
                updatedCollege
            });

        } catch (error) {
            // Manual rollback if needed
            if (updatedCollege) {
                await collegeModel.findByIdAndUpdate(
                    collegeId,
                    { $addToSet: { canteens: adminId } }
                );
            }
            throw error;
        }

    } catch (error) {

        console.error("Error removing college canteen:", error);
        res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });

    }
}