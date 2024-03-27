import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
// additional functionalities add karta hai mongoose aggregate

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary
            required: true,
        },
        thumbnail: {
            type: String, //cloudinary
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        discription: {
            type: String,
            required: true,
        },
        duration: {
            type: String, //cloudinary
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User "
        }

    }, { timestamps: true }
)


// mongoose k apne middleware hote hain jese pre post, plugin
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)