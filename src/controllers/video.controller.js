import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs'

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
    // console.log(video);
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

const updateViewsCount=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    
    const video=await Video.findByIdAndUpdate(
        videoId,
        {
            $inc:{views:1}
        },
        {new:true}
    ).select("_id title views")

    if(!video.views){
        throw new ApiError(404,"video not found with this videoId")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $push:{
                watchHistory:{
                    $each:[videoId],
                    $position:0
                }
            }
        }
    )

    res.status(200)
    .json(
        new ApiResponse(200,video,"video view count increased and added to current user's watch history successfully")
    )

})

const getVideoById=asyncHandler(async(req,res) => {
    const {videoId}=req.params
    if (videoId.trim()=="") {
        throw new ApiError(400,"video Id is missing")
    }

    const videoDetails=await Video.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(videoId)}
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"subscribedChannel",
                            as:"subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscribersCount:{
                                $size:"$subscribers"
                            },
                            isCurrentUserSubscribed:{
                                $cond:{
                                    if:{
                                        $in:[req.user?._id,"$subscribers.subscriber"]
                                    },
                                    then:true,
                                    else:false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1,
                            subscribersCount:1,
                            isCurrentUserSubscribed:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$owner"
        }
    ])

    if (videoDetails?.length==0) {
        throw new ApiError(400,"video id wrong or something went wrong while fetching video details")
    }

    res.status(200)
    .json(
        new ApiResponse(200,videoDetails[0],"video details fetched successfully")
    )
})

const updateVideo=asyncHandler( async(req, res)=> {
    const{title,description,tags,ownerId,oldThumbnailUrl} = req.body
    const{videoId}=req.params

    if (videoId.trim()==="") {
        throw new ApiError(400,"video Id is missing")
    }
    if (ownerId!=req.user?._id) {
        throw new ApiError(401,"you are not owner and not authorized to update this video")
    }
    
    if (title?.trim()=="") {
        throw new ApiError(400,"title cannot be empty")
    }

    const updateFields={}

    if(title) updateFields.title = title
    if(description) updateFields.description = description
    if(tags) updateFields.tags = tags

    const localThumbnailPath=req.file?.path
    if (localThumbnailPath) {
        const thumbnail=await uploadOnCloudinary(localThumbnailPath,"image")
        if (!thumbnail) {
            fs.unlinkSync(localThumbnailPath)
            throw new ApiError(400,"thumbnail file error in uploading in cloudinary")
        }
        updateFields.thumbnail=thumbnail.url
        deleteFromCloudinary(oldThumbnailUrl)
    }

    const videoDetails=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:updateFields
        },
        {new:true}
    )

    if (!videoDetails) {
        throw new ApiError(404,"video not found or wrong video id")
    }

    res.status(200)
    .json(
        new ApiResponse(200,videoDetails,"video details updated successfully")
    )
})

const deleteVideo=asyncHandler(async(req,res)=>{
    const{videoId}=req.params
    const{ownerId,videoUrl,thumbnailUrl}=req.body
    if (ownerId!=req.user?._id) {
        throw new ApiError(401,"you are not owner and not authorized to delete this video")
    }

    await Video.findByIdAndDelete(videoId)

    if (videoUrl) {
        deleteFromCloudinary(videoUrl,"video")
    }
    if (thumbnailUrl) {
        deleteFromCloudinary(thumbnailUrl,"image")
    }

    res.status(200)
    .json(
        new ApiResponse(200,{},"video deleted successfully")
    )
})
export {
    postVideo,
    updateViewsCount,
    getVideoById,
    updateVideo,
    deleteVideo
}