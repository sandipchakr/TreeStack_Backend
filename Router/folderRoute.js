import express from "express";
import Folder from "../Models/Folder.js";
import Video from "../Models/Video.js";
import { requireAuth } from "../Middleware/auth.js";

const router = express.Router();

//create a new folder:-
router.post("/",requireAuth,async(req,res)=>{
    try {
        const {foldername} = req.body;
        const existingFolder = await Folder.findOne({
            foldername: foldername.trim(),
            userId: req.user._id
        });

        if (existingFolder) {
            return res.status(400).json({
                success: false,
                error: "Folder with this name already exists"
            });
        }
        const folder = await Folder.create({
            foldername,
            userId: req.user._id,
        });
        // console.log(folder);
        res.status(201).json({success:true,folder});
    } catch (error) {
        res.status(500).json({error:"Failed to create a new folder"});
    }
});
router.get("/",requireAuth,async(req,res)=>{
    try{
        const folders = await Folder.find({userId:req.user._id})
        res.json({success:true,folders});
    }
    catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch folders" });
  }
});

router.get("/search",requireAuth,async(req,res)=>{
  try{
     const { foldername } = req.query;  //  use query not body
    if (!foldername) {
      return res.status(400).json({ success: false, error: "Folder name required" });
    }
    const folder = await Folder.find({
      foldername: { $regex: foldername, $options: "i" },
      userId: req.user._id,
    });
    res.json({success:true,folder});
  }catch(error){
    res.status(500).json({ success: false, error: "Failed to fetch folders" });
  }
})

//update folder name:-
router.put("/:id",requireAuth, async (req, res) => {
  try {
    const { foldername } = req.body;

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, // ensure user owns the folder
      { foldername: foldername },
      { new: true }
    );

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: "Error updating folder", error });
  }
});
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const folder = await Folder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    await Video.deleteMany({ folderId: folder._id });
    res.json({ success:true,message: "Folder deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting folder", error });
  }
});
export default router;