import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    college: {
        type: String,
        trim: true
    },
    contact: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"]
    },
    email: {
        type: String,
        trim: true,
        match: [/\S+@\S+\.\S+/, "Invalid email format"]
    },
    password: {
        type: String,
        trim: true,
        // match: [/^(?=.[a-z])(?=.[A-Z])(?=.*\d)(?=.*[@$!?&%*])[A-Za-z\d@$!%*?&]{8,}$/,"Password must contain atleast 8 characters, one uppercase, one lowercase, one symbol"]
    },
    profilePicture: {
        type: String,
        default: 'default.jpg'
    },
    otp: {
        type: String,
        default: null
    },
    otpExpire: {
        type: Date,
        default: null
    },
    usertype: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
        required: [true, "Please select user type"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
