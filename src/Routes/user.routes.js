import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../Controllers/user.controller.js";
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
const router = Router();
// Yaha logic likenge or router ko export karenge app.js file mai
router.route("/register").post(
    // Yaha middleware use karenge register karne se pahle image or avatar local mai store karne k liye 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser);


// Secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
export default router;