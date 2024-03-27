import dotenv from "dotenv"
import connectDB from "./DB/index.js";
import { app } from "./app.js";
dotenv.config({
    path: './env'
})
// This is an async function so it will return a promise and we can access that by using .then,.catch
const port = process.env.PORT || 8000;
connectDB()
    .then(() => {
        app.on("error", () => {
            console.log("ERROR: ", error);
            throw error
        })
        // Sherrr
        app.listen(port, () => {
            console.log(`Server is running on ${port}`)
        })
    })
    .catch((err) => {
        console.log("MONGODB connection failed !!! ", err);
    })












































/*
import express from "express";

const app = express()

    // ; it cleans the line previous to it
    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            app.on("error", () => {
                console.log("ERROR: ", error);
                throw error
            })
            app.listen(process.env.PORT, () => {
                console.log(`App is listen on port ${process.env.PORT}`)
            })
        } catch (error) {
            console.log("Error: ", error);
            throw error
        }
    })()
    */