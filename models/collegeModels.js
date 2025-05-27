import mongoose from 'mongoose';

const collegeScehma = new mongoose.Schema({

    canteens: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }],
    collegeName: {
        type: String,
        required: true,
        trim: true,
    },
    collegeEmail: {
        type: String,
        required: true,
        default: null,
        unique: true,
        match: /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/
    },
    collegePassword: {
        type: String,
        required: true,
        select: false,
        // match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
    },
    collegeCode: {
        type: String,
        required: true,
        unique: true,
        match: /^[A-Z]{3}\d{3}$/,
        trim: true
    },
    collegeAddress: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})

const collegeModel = mongoose.model('College', collegeScehma);
export default collegeModel;