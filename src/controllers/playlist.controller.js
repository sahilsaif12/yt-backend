import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlaylist=asyncHandler(async(req, res)=>{
    const {title,desc}=req.body;

    if (title?.trim()=="") {
        throw new ApiError(400,"playlist title is required");
    }
    
    const playlist=await Playlist.create({
        title,
        desc,
        owner:req.user?._id
    })
    
    if (!playlist) {
        throw new ApiError(400,"something went wrong when creating playlist");
    }

    res.status(200)
    .json(
        new ApiResponse(200,playlist,"playlist created successfully")
    )
})

const getAllPlaylists = asyncHandler(async(req, res) => {
    
    const playlists= await Playlist.find(
        {owner:req.user?._id},
        {}
        ).sort({createdAt:-1})

    if (!playlists) {
        throw new ApiError(500,"error while finding user playlists")
    }

    res.status(200)
    .json(
        new ApiResponse(200,playlists,"user's all playlists fetched successfully")
    )
})

const getPlaylistById=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params

    const playlist=await Playlist.aggregate([
        {
            $match:{_id: new mongoose.Types.ObjectId(playlistId)}
        },
        {
            $lookup:{
                from:"videos",
                foreignField:"_id",
                localField:"videos",
                as:"videos"
            }
        }
    ])

    if (playlist?.length==0) {
        throw new ApiError(400,"invalid playlist id")
    }
    
    res.status(200)
    .json(
        new ApiResponse(200,playlist[0],"playlist fetched successfully")
    )
})

const addVideoToPlaylist=asyncHandler(async(req,res)=>{
    const {playlistId,videoId} = req.params

    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos:{
                    $each: [videoId]
                }
            }
        },
        {new:true}
    )
    
    if (!playlist) {
        throw new ApiError(400,"invalid playlist id")
    }

    res.status(200)
    .json(
        new ApiResponse(200,playlist,"video added to playlist successfully")
    )
})

const removeVideoFromPlaylist=asyncHandler(async(req,res) =>{
    const {playlistId,videoId} = req.params

    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos:videoId
            }
        },
        {new:true}
    )
        
    if (!playlist) {
        throw new ApiError(400,"invalid playlist id")
    }
    
    res.status(200)
    .json(
        new ApiResponse(200,playlist,"video removed from the playlist successfully")
    )
})

const updatePlaylist=asyncHandler(async(req,res) => {
    const {playlistId}=req.params
    const {title,desc}=req.body

    if (title?.trim() == "") {
        throw new ApiError(400, "playlist title cannot be empty")
    }

    const updateFields = {}

    if (title) updateFields.title = title
    if (desc) updateFields.desc = desc

    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:updateFields
        },
        {new :true}
    )

    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    res.status(200)
    .json(
        new ApiResponse(200,playlist,"playlist Updated successfully")
    )
})

const deletePlaylist=asyncHandler(async(req,res) => {
    const {playlistId}=req.params

    const playlist=await Playlist.findByIdAndDelete(
        playlistId
    )

    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    res.status(200)
    .json(
        new ApiResponse(200,{deleted:true,}, "playlist deleted successfully")
    )
})

export{
    createPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,
    getAllPlaylists
}