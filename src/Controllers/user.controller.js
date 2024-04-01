import { asyncHandler } from "../Utils/asyncHandler.js"
import { ApiError } from "../Utils/ApiError.js"
import { User } from "../Models/user.model.js"
import { uploadOnCloudinary } from "../Utils/cloudinary.js"
import ApiResponse from "../Utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(409, "Authentication Error.");
    }
    const check = await user.isPasswordCorrect(oldPassword);
    if (!check) throw new ApiError(409, "You have entered incorrect password.");
    user.password = newPassword;
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, {}, "Your password has successfully changed.")
    )


})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;
    return res.status(200).json(new ApiResponse(200, user, `Current user is ${user.username}`))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName,
            email: email
        }
    }, {
        new: true
    }).select("-password")
    return res.status(200)
        .json(new ApiResponse(200, user, "The details has been updated."))
})
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing.")
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) throw new ApiError(400, "Error while uploading avator file on Cloud.")
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Avatar is successfully updated."))



})
const updateUserCover = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path
    if (!coverLocalPath) throw new ApiError(400, "Cover Image is missing.")
    const cover = await uploadOnCloudinary(coverLocalPath)
    if (!cover) throw new ApiError(400, "Error while uploading cover image on Cloud.")
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: cover.url
            }
        }, { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Cover Image is successfully updated."))
})
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    console.log(req.params);
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing.")
    }
    // Pahle hum dekhenge username hai ya nhi is baar 
    // Aggregate pipelinese ki madad se 
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            },
        },
        {
            $lookup: {
                from: "subscriptions", // collection
                localField: "_id", //user ki id
                foreignField: "channel", //is user id k channel mai jo document aayenge wo sare subscribers honge 
                as: "subscribers"
            },
        },
        {
            $lookup: {
                from: "subscriptions", // collection
                localField: "_id", //user ki id
                foreignField: "subscriber", //is user id k subscribed mai jo document aayenge wo sare channels honge jinko hume subscribed kiya hai
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo" //$ isliye qki a wo ek field hai.
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?.id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                isSubscribed: 1,
                subscribedTo: 1,
                subscribers: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
    console.log(channel);
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists.")
    }
    return res.status(200).json(new ApiResponse(200, channel[0], "User Channel fetched successfully."))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
                // aggregate pipelines mai moongoose ki id direct nhi daal skte .
            },

        }, {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                        //yaha agar project lagate to user mai data pura aata bs project kam hota andar lagane se sirf utna hi data aaya jitna zaruri tha

                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                        // aarray ka pahla element nikaal lelnge returned owner mai se
                    }
                ]
            }
        },

    ])
    return res.status(200).json(
        new ApiError(200, user[0].watchHistory, "Fetched  watch history Successfully.")
    )

})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCover,
    getUserChannelProfile,
    getWatchHistory
};