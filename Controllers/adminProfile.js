import adminModel from "../models/adminModel.js";
// import bcrypt from "bcryptjs";
// import { generateAdminToken } from "../utils/jwt.js";

export const getProfile = async (req, res) => {
    try {
        const { adminId } = req.params;
        if (!adminId) {
            console.log("AdminId couldn't be fetched from frontend .");
            return res.status(404).json({
                success: false,
                message: "Admin ID is required"
            });
        }
        console.log("AdminId : ", adminId);

        const admin = await adminModel.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }
        console.log("admin : ", admin);

        const adminProfile = {
            adminName: admin.adminName,
            adminEmail: admin.adminEmail,
            collegeName: admin.collegeName,
            phoneNumber: admin.phoneNumber
        }
        console.log("Admin Profile : ", adminProfile);

        res.status(200).json({
            success: true,
            message: "Admin Profile fetched successfully",
            adminProfile
        })
    } catch (error) {
        console.error("Error fetching profile:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { adminId } = req.params;

        if (!adminId) {
            return res.status(404).json({
                success: false,
                message: "Admin ID is required"
            });
        }
        console.log("adminId : ", adminId);

        const { adminName, adminEmail, collegeName, phoneNumber } = req.body;

        const updatedProfile = await adminModel.findByIdAndUpdate(adminId, {
            adminId,
            adminName,
            adminEmail,
            phoneNumber,
            collegeName
        }, { new: true });

        if (!updatedProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            updatedUserData: {
                adminId: updatedProfile._id,
                adminName: updatedProfile.adminName,
                adminEmail: updatedProfile.adminEmail,
                phoneNumber: updatedProfile.phoneNumber,
                collegeName: updatedProfile.collegeName
            }
        })

    } catch (error) {
        console.error("Error updating profile:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error up",
            error: error.message
        });
    }
}

export const deleteProfile = async (req, res) => {
    try {
        const { adminId } = req.params;
        if (!adminId) {
            return res.status(404).json({ message: "Please provide adminId" });
        }
        console.log("adminId : ", adminId);

        const deleteProfile = await adminModel.findByIdAndDelete(adminId);

        if (!deleteProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.clearCookie("adminToken", {
            httpOnly: true,
            secure: false,
            sameSite: "none",
        })
            .status(200).json({
                success: true,
                message: "Profile deleted successfully",
                profile: deleteProfile
            })

    } catch (error) {
        console.error("Error deleting profile:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });

    }
}       