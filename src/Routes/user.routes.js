import { Router } from "express";
import { registerUser } from "../Controllers/user.controller.js";
const router = Router();
// Yaha logic likenge or router ko export karenge app.js file mai
router.route("/register").post(registerUser)

export default router;