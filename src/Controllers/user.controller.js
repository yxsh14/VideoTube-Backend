import { asyncHandler } from "../Utils/asyncHandler.js"
import { ApiError } from "../Utils/ApiError.js"
import { User } from "../Models/user.model.js"
import { uploadOnCloudinary } from "../Utils/cloudinary.js"
import ApiResponse from "../Utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(async (req, res) => {
    // 1. Taking data from frontend
    const { fullName, email, username, password } = req.body

    // 2. Validate the data
    if ([fullName, email, username, password].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All fields are reqired")
    }

    // 3. Check for unique email & username
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) throw new ApiError(409, "Username or Email already exists")

    // 4. check for files 
    console.log(req.files)
    const AvatarLocalPath = req.files?.avatar[0]?.path;
    // const CoverImageLocalPath = req.files?.coverImage[0]?.path;

    let CoverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        CoverImageLocalPath = req.files.coverImage[0].path;
    }


    // 5. the avatar image is must so we'll check it.
    if (!AvatarLocalPath) throw new ApiError(400, "Avatar file is required")

    // 6.Upload these files on cloudinary
    const avatar = await uploadOnCloudinary(AvatarLocalPath);
    const coverImage = await uploadOnCloudinary(CoverImageLocalPath)
    if (!avatar) throw new ApiError(400, "Avatar file is required");

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // Check karenge database mai user aaya hai ki nhi aya hoga to usko return karenge par password or refreshToken ko return nhi karenge.
    const createdUser = await User.findById(user._id)?.select("-password -refreshToken");

    if (!createdUser) throw new ApiError(500, "Something went wrong while creating the account.")
    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registered successfully.")
    )



})
const generateAccessAndRefreshToken = (async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        // refreshToken ko database mai bhi save karana hoga 
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token.")
    }
})
const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body
    if (!(username || email)) throw new ApiError(409, "Username or Email is required");
    if (!password) throw new ApiError(409, "Password is required");
    const foundUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!foundUser) throw new ApiError(409, "User Not Found");
    const check = await foundUser.isPasswordCorrect(password);
    if (!check) throw new ApiError(409, "Invalid User Credentials");
    // console.log(foundUser._id);
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(foundUser._id);


    // ab hume logged in user bhi to return karna hai so 
    const loggedInUser = await User.findById(foundUser._id).select("-password -refreshToken")

    // Cookies bejhenge pahle options design karenge 
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User is successfully logged in.")
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    // ab logout k liye user kaha se le kar aayenge iska answer hai jwt se pr uske liye ek middleware create karna padega 
    //auth.middleware.js

    // middleware run karne k baad req.body mai user ka access hoga 
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined }
    })
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out Successfully."))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request")
    // Ye hume raw token dega jo user k pass pahucha hai 
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options).json(
                new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed.")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export { registerUser, loginUser, logoutUser, refreshAccessToken };