// routes/videoRoutes.js
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import Video from "../Models/Video.js";
import Folder from "../Models/Folder.js";
import { requireAuth } from "../Middleware/auth.js";

const router = express.Router();

async function getMetaData(url) {
  try {
    // youtube special case
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      // Use YouTube oEmbed API for metadata
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const { data } = await axios.get(oembedUrl);

      return {
        title: data.title,
        thumbnail: data.thumbnail_url
      };
    }

    // for instagram special case
    
    if (url.includes("instagram.com")) {
      try {
        // Public Instagram posts (official oEmbed)
        const oembedUrl = `https://graph.facebook.com/v12.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true`;
        const { data } = await axios.get(oembedUrl);
        return {
          title: data.title || "Instagram Post",
          thumbnail: data.thumbnail_url
        };
      } catch (instaErr) {
        console.warn("Instagram oEmbed failed, fallback to OG scraping:", instaErr.message);
        // fallback: scrape OG meta
        const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const $ = cheerio.load(data);
        const title = $('meta[property="og:title"]').attr("content") || "Instagram Post";
        const thumbnail = $('meta[property="og:image"]').attr("content") || "";
        return { title, thumbnail };
      }
    }

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0" // some sites block bots without UA
      }
    });

    const $ = cheerio.load(data);

    // Extract OG tags
    const title = $('meta[property="og:title"]').attr("content") || $("title").text();
    const thumbnail = $('meta[property="og:image"]').attr("content");

    return { title, thumbnail };
  } catch (err) {
    // console.error("Error fetching metadata:", err.message);
    return { title: "Unknown Title", thumbnail: "" };
  }
}
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Add video to folder
router.post("/", requireAuth, async (req, res) => {
  try {
    const { folderId, link } = req.body;

    if (!isValidUrl(link)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // Check if folder belongs to user
    const folder = await Folder.findOne({ _id: folderId, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    //  folderId = folderId.trim();

    // Fetch title + thumbnail
    const { title, thumbnail } = await getMetaData(link);
    const video = await Video.create({
      folderId,
      link,
      title,
      thumbnail
    });

    res.status(201).json({ success: true, message: "Video Link Successfully Added", video });
  } catch (error) {
    console.error("Error adding video:", error);
    res.status(500).json({ error: error.message, message: "something went wrong.." });
  }
});

//get all video link:-
router.get("/:folderId", requireAuth, async (req, res) => {
  try {
    const { folderId } = req.params;

    const videos = await Video.find({ folderId });
    if (!videos || videos.length === 0) {
      return res.status(404).json({ message: "No videos found in this folder" });
    }

    // console.log(videos);
    res.status(200).json({ success: true, videos });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update video title:-
router.put("/:id",requireAuth, async(req,res)=>{
  try {
    const { title } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      { title: title.trim() },
      { new: true } // return updated document
    );

    if (!updatedVideo) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    res.json({ success: true, message: "Video title updated successfully", video: updatedVideo });
  } catch (error) {
    console.error("Update video error:", error.message);
    res.status(500).json({ success: false, message: "Server error while updating video" });
  }
});

//update isRead:-
router.put("/:id/read", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    video.isRead = !video.isRead; // toggle
    await video.save();

    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete a video from a folder
router.delete("/:videoId", requireAuth, async (req, res) => {
  try {
    const { videoId } = req.params;

    // Find the video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Make sure the folder belongs to the logged-in user
    const folder = await Folder.findOne({ _id: video.folderId, userId: req.user._id });
    if (!folder) {
      return res.status(403).json({ message: "Not authorized to delete this video" });
    }

    // Delete the video
    await Video.findByIdAndDelete(videoId);

    res.json({success:true, message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
