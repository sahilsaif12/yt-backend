import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
},
    { timestamps: true }
)

export const Playlist=mongoose.model("Playlist",playlistSchema)