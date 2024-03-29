import { User } from "../Models/user.model.js";
import { ApiError } from "../Utils/ApiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // jwt token yaa to header mai hoga ya cookie mai

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) throw new ApiError(401, "Unauthorized Request")

        // ab token mil gaya to usko verify bhi karenge 

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decodedToken) throw new ApiError(401, "Invalid Access Token");
        // ab decoded token mai wahi hoga jo jwt.sign karte waqt dala honga 
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) throw new ApiError(401, "Invalid Access Token");
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Access Token")
    }
})
