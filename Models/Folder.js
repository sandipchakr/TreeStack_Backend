import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
    foldername: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // connect folder to the user who created it
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("Folder", folderSchema);