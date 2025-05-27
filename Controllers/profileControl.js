import userModel from "../models/authModels.js";
import bcrypt from "bcryptjs";
import {generateToken} from "../utils/jwt.js";

export const getProfile = async (req, res) => {

    try {
        const { userId } = req.params;
        const profile = await userModel.findOne({ userId });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        const { name, email, phoneNumber, profilePicture } = profile;
        const userProfile = {
            name,
            email,
            phoneNumber,
            profilePicture
        }
        res.status(200).json({
            message: "Profile fetched successfully",
            userProfile
        });

    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Internal server error" });

    }
}
export const updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(404).json({ message: "Please provide userId" });
        }

        const { name, email, phoneNumber, profilePicture } = req.body;

        const updatedProfile = await userModel.findByIdAndUpdate(userId, {
            userId,
            name,
            email,
            phoneNumber,
            profilePicture
        }, { new: true });

        if (!updatedProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            updatedUserData: {
                userId: updatedProfile._id,
                name: updatedProfile.name,
                email: updatedProfile.email,
                phoneNumber: updatedProfile.phoneNumber,
                profilePicture: updatedProfile.profilePicture
            }
        })

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error up" });

    }
}

export const deleteProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(404).json({ message: "Please provide userId" });
        }

        const deleteProfile = await userModel.findByIdAndDelete(userId);

        if (!deleteProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "none",
        })
            .status(200).json({
                message: "Profile deleted successfully",
                profile: deleteProfile
            })

    } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).json({ message: "Internal server error" });

    }
}

export const changePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(404).json({ message: "Please provide userId" });
        }

        const { password, newPassword } = req.body;
        if (!password || !newPassword) {
            return res.status(400).json({ message: "Please fill the old and new password inbox" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }

        const hasdedNewPassword = await bcrypt.hash(newPassword, 10);
        const userNewPasssword = await userModel.findByIdAndUpdate(userId, { password: hasdedNewPassword }, { new: true });
        if (!userNewPasssword) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = generateToken(user._id);
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        }).status(200).json({
            message: "Password updated successfully",
            password: newPassword
        })

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Internal server error" });

    }
} 