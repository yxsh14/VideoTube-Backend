import { asyncHandler } from "../Utils/asyncHandler.js"
const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "Like the sun we will live and rise."
    })
})

export { registerUser };