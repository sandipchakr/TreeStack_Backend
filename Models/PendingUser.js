import mongoose from "mongoose"

const pendingSchema = new mongoose.Schema({
    firstname:{
        type: String,
        required: true,
    },
    lastname:{
        type:String,
        required: true,
    },
    email:{
        type: String,
        unique: true,
        required: true,
    },
    password:{
        type:String,
        required: true,
    },
    otp:{
        type: String,
    },
    otpExpiry:{
        type: Date
    }
});

export default mongoose.model("pendinguser",pendingSchema);
