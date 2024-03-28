// pahle file ko local server pr add karenge direct upload bhi kar skte hain pr hum user ko reupload ka bhi de skte ki bhai change karlo submit hone pr hum file ko cloudinary pr save kar denge or local server se delete kar denge [file handling].

import { v2 as cloud } from "cloudinary";
import fs from "fs" //file system read write delete jese operations provide karta hai node js k saath aata hai.


cloud.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("Could not find file path.")
            return null;
        }
        const response = await cloud.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("The file is uploaded successfully ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        // ab hum upload nhi kar paaye hain to server mai na rahe to unlink to karna padega
        fs.unlinkSync(localFilePath)
        console.log("ERROR: ", error);
        return null;
    }
}

// Ab local server pr multer ka use karke aayegi file ek middleware banayege.