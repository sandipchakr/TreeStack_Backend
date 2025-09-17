import JWT from "jsonwebtoken";
import User from "../Models/User.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const secret = process.env.JWT_SECRET;

export function createTokenForUser(user){
    const payload = {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
    };
    const token = JWT.sign(payload,secret);
    return token;
};

export function validateToken(token){
    const payload = JWT.verify(token,secret);
    return payload;
}
export async function checkpassword(email,plainPassword){
    const user = await User.findOne({email});
    if(!user) throw new Error ("User not found");

   const match = await bcrypt.compare(plainPassword,user.password)
   if(!match) throw new Error("Invalid password");

    const token = createTokenForUser(user);
    return token;
}

