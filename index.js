import express from "express";
import userRoute from "./Router/userRoute.js"
import folderRoute from "./Router/folderRoute.js"
import videoRoute from "./Router/videoRoute.js"
import mongoose from "mongoose";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8000;
import checkForAuthenticationCookie from "./Middleware/auth.js";
import { requireAuth } from "./Middleware/auth.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

//mongodb connection:-
mongoose.connect(process.env.MONGO_URL).then(()=>console.log("mongodb connected.."))

//middleware:-
app.use(cors({
    origin: "https://tree-stack.vercel.app",
    credentials: "include",  
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));

app.get("/",requireAuth,(req,res)=>{
    res.json({message: "Jai Shree Krishna !"});
});
app.get("/homepage",(req,res)=>{
    if(!req.user) res.json({message:"you need to login"})
    res.json({message:`wellcome ${req.user.Firstname}`})
})

app.get("/api/health",(req,res)=>{
    res.json({message:"OK, Server started..."})
})

app.use("/api/user",userRoute);
app.use("/api/folder",folderRoute);
app.use("/api/video",videoRoute);

app.listen(PORT,()=>console.log("Server start at port: "+PORT));