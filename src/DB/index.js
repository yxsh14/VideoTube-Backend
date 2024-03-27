import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("MongoDB Connected");
        console.log("DB HOST: ", connectionInstance.connection.host);
    } catch (error) {
        console.log("MONGODB connection FAILED: ", error);
        // Ya to hum throw ka use karke error throw kar skte hain or process roke sakte hain. 
        // ya fir direct process ko access kar skte ye functionality node mai hoti hai
        process.exit(1)
    }
}
export default connectDB;