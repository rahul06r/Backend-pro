import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";


import  jwt  from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")


        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }


        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SCERET)


        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid AccesToken")

        }


        // passing on
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")

    }

})