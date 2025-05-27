import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    // collegeId:{
    //     type: mongoose.SchemaTypes.ObjectId,
    //     ref: 'College',
    //     unique: true,
    //     trim: true
    // },
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
    collegeDetails: [
        { 
            collegeName: { 
                type: String, 
                required: true, 
                trim: true 
            },
            collegeId: { 
                type: String, 
                required: true, 
                trim: true 
            },
             
        }
    ],
    role :{
        type: String,
        enum: ["admin", "user"],
        default: "admin",
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }

});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;