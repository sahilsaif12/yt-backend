import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const postVideo=asyncHandler(async(req, res)=>{
    const {title,description,tags} = req.body
    const videoLocalPath=req.files?.video?.length>0 ? req.files.video[0].path : false
    const thumbnailLocalPath=req.files?.thumbnail?.length>0 ? req.files.thumbnail[0].path : false
    if(!videoLocalPath) {
        throw new ApiError(404,"video file is required")
    }
    
    if (title?.trim()==="") {
            if (videoLocalPath) fs.unlinkSync(videoLocalPath)
            if (thumbnailLocalPath) fs.unlinkSync(thumbnailLocalPath)
            throw new ApiError(400," video title is required ! ")
    }
    
    const video=await uploadOnCloudinary(videoLocalPath)
    console.log(video);
    if(!video) {
        if (thumbnailLocalPath) fs.unlinkSync(thumbnailLocalPath)
        throw new ApiError(400,"video file error while uploading in cloudinary")
    }
    const duration=Math.ceil(video.duration) 

    let thumbnail=""
    if (thumbnailLocalPath) {
        const response=await uploadOnCloudinary(thumbnailLocalPath)
        thumbnail=response.url
    }
    const videoDetails=await Video.create({
        title,
        description,
        tags,
        videoFile:video.url,
        thumbnail,
        duration,
        owner:req.user?._id
    })

    if (!videoDetails) {
        throw new ApiError(500," server problem while uploading video data to database ! ")
    }

    res.status(200)
    .json(
        new ApiResponse(200,videoDetails,"video posted successfully")
    )
})

export {
    postVideo
}