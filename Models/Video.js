import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder", // connect video to a folder
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isRead:{
    type: Boolean,
    default:false,
  }
});

export default mongoose.model("Video", videoSchema);
