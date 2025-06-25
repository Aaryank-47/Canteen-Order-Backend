import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    collegeId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'College',
        unique: true,
        trim: true
    },
    collegeName: {
        type: String,
        required: true,
        trim: true
    },
    adminName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Phone number must be 10 digits"]
    },
    adminEmail: {
        type: String,
        required: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, "Invalid email format"]
    },
    adminPassword: {
        type: String,
        required: true,
        trim: true
    },
    otp: {
        type: String,
        default: null
    },
    otpExpire: {
        type: Date,
        default: null
    },
    foodId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Food',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "admin",
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    dailyOrderCounter: {
        type: Number,
        default: 1
    },
    lastOrderDate: {
        type: Date,
        default: new Date(0) // Initialize to epoch
    }

});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;