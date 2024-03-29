//Hum database connect kar chuke hain ab hume server run kara kar database ko use karna shuru karna pade.

import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";


export const app = express();
// use is a middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


// Data json mai ayega par kitna aayega wo bhi to decide karna hoga wrna server crash ho jayega 
// LIMIT LAGA DI
app.use(express.json({ limit: "16kb" })) //body se data ayega to yaha ayaega 


// agar data url se aayega to ....
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static("public")) // static files public folder for public assets like images
app.use(cookieParser()) // server can set and remove cookies from browser.



// Import karenge router ko 
import userRouter from "./Routes/user.routes.js"
// app.get use nhi karte qki router is file mai define nhi hai to hum middleware ki madad se route set karenge 

app.use("/api/v1/users", userRouter);
