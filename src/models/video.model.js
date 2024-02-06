import mongoose,{Schema} from "mongoose";
// import {mongooseAggregatePaginate} from 'mongoose-aggregate-paginate-v2'

const videoSchema=new Schema(
    {
        title:{
            type:String,
            required:true,
            trim:true,
        },
        description:{
            type:String,
            trim:true,
        },
        tags:{
            type:[String]
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        duration:{
            type:Number,
            // required:true,
        },
        views:{
            type:Number,
            default:0,
        },
        isPublished:{
            type : Boolean,
            default:true,
        },
        videoFile:{
            type:String,
            required:true,
        },
        thumbnail:{
            type:String,
        }
    },
    {timestamps:true}
)

// videoSchema.plugin(mongooseAggregatePaginate)

export const Video=mongoose.model("Video",videoSchema)