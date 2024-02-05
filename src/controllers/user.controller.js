import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs'
const generateAccessAndRefreshToken = async(userId) => {

    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken=refreshToken
    user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}

}

const registerUser=asyncHandler(async(req, res)=>{
    //# steps :
    //* 1. get user details from frontend
    //* 2. validation - not empty
    //* 3. check if user already exists: username, email
    //* 4. check for images, check for avatar
    //* 5. upload them to cloudinary, avatar
    //* 6. create user object - create entry in db
    //* 7. remove password and refresh token field from response
    //* 8. check for user creation
    //* 9. return res

    const {username,email,password,fullName} = req.body
    
    const avatarLocalPath=req.files.avatar?.length>0? req.files.avatar[0].path : false
    const coverImageLocalPath=req.files.coverImage?.length>0? req.files.coverImage[0].path : false
    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar is required")
    }

    if([username,email,password,fullName].some((field)=>field?.trim()==="")){
        if (avatarLocalPath) fs.unlinkSync(avatarLocalPath)
        if (coverImageLocalPath) fs.unlinkSync(coverImageLocalPath)
        throw new ApiError(400,"Few fields are empty. All fields are required ! ")
    }
    
    
    const existedUser=await User.findOne({
        $and:[{email},{username}]
    })
    if (existedUser) {
        if (avatarLocalPath) fs.unlinkSync(avatarLocalPath)
        if (coverImageLocalPath) fs.unlinkSync(coverImageLocalPath)
        throw new ApiError(401,"An user already exists with either this username or email")
    }
    // console.log(req.files);

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar) {
        throw new ApiError(400,"Avatar is required")
    }
    
    const coverImage="";
    if (coverImageLocalPath) {
        const response = await uploadOnCloudinary(coverImageLocalPath)
        coverImage=response.url
    }

    const user=await User.create({
        email,
        username,
        password,
        fullName,
        avatar:avatar.url,
        coverImage,
    })
    
    const createdUser=await User.findById(user._id)
    .select("-password -refreshToken")
    
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }
    return res.status(200).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )
})


const loginUser=asyncHandler(async (req, res) => {
    //* 1.extract data from  req body -> data
    //* 2.username or email
    //* 3.find the user
    //* 4.password check
    //* 5.generate access and refresh token
    //* 6.send res and add cookie

    const {email,password,username} =  req.body
    console.log(email);
    if(!(email||username)) {
        throw new ApiError(400,"username or email required must")
        // if (!username) {
        // }
    }

    const user=await User.findOne({
        $or: [{email},{username}]
    })

    if (!user) {
        throw new ApiError(404,"User not found ")
        
    }

    const isPasswordValid=await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401,"incorrect password !")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
    const loggedInUser=await User.findById(user._id)
    .select("-password -refreshToken")

    const options={
        httpOnly: true,
        secure:true
    }

    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,loggedInUser,"user logged in successfully")
    )
})

const logoutUser=asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset:{
                refreshToken:''
            }
        },
        {new:true}
    )

    const options={
        httpOnly: true,
        secure:true
    }

    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"user logged out successfully")
    )
    
})

const refreshAccessToken =asyncHandler(async(req, res)=>{
    const incomingRefreshToken=req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400,"no refresh token found")
    }

    let userId=null
    await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET_KEY,(err,decoded)=>{
        if (err) {
            if (err.name === "TokenExpiredError") {
                throw new ApiError(400,"Given refresh token is expired")
            }else{
                throw new ApiError(401,"Unauthorized token",[err.message])
            }
        }else{
            userId=decoded?._id
            
        }
    })
    
    
    const user=await User.findById(userId)
    if (!user) {
        throw new ApiError(400,"invalid refresh token")
    }

    if (incomingRefreshToken!==user?.refreshToken) {
        throw new ApiError(401,"refresh token not matching")
    }

    const {accessToken, refreshToken}=await generateAccessAndRefreshToken(user?._id)
    const options={
        httpOnly: true,
        secure:true
    }

    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {accessToken,refreshToken},
            "tokens are updated successfully")
    )
})


const changeCurrentPassword=asyncHandler(async(req, res)=>{
    const{oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400,"incorrect old password")
    }
    
    user.password=newPassword
    user.save({validateBeforeSave:false})

    res.status(200)
    .json(
        new ApiResponse(200,{},"password changed successfully")
    )
})

const getCurrentUser=asyncHandler(async (req, res) =>{
    const user = req.user
    res.status(200)
    .json(
        new ApiResponse(200,{
            email:user.email,
            fullName:user.fullName,
            username:user.username,
            avatar:user.avatar,
            coverImage:user.coverImage,
        },
        "User details fetched successfully")
    )
})

const updateAccountDetails=asyncHandler(async(req, res)=>{
    const{email,fullName,username}=req.body
    if(!(email || fullName || username)){
        throw new ApiError(400,"edited account details can't be blank")
    }
    const fieldsToUpdate={}
    if (email?.trim()!="") fieldsToUpdate.email=email
    if (fullName?.trim()!="") fieldsToUpdate.fullName=fullName
    if (username?.toLowerCase().trim()!=""){
        const existedUsername=await User.findOne({username})
        if (existedUsername) {
            throw new ApiError(400,"that username already exists, please try another")
        }else{
            fieldsToUpdate.username=username
        }
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: fieldsToUpdate
        },
        {new:true}
    ).select("-password -refreshToken")
    
    res.status(200)
    .json(
        new ApiResponse(200,user,"field are updated successfully")
    )
})

const updateUserAvatar=asyncHandler(async(req, res)=>{
    // console.log(req.file);
    const avatarLocalPath=req.file?.path
    if (!avatarLocalPath) {
        fs.unlinkSync(avatarLocalPath)
        throw new ApiError(400,"avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        fs.unlinkSync(avatarLocalPath)
        throw new ApiError(400,"avatar file error in uploading in cloudinary")
    }

    const deleteOldAvatar=deleteFromCloudinary(req.user?.avatar)
    if (!deleteOldAvatar){
        console.log("error in deleting old avatar file");
    }

    const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar:avatar.url},
        },
        {new:true}
    ).select("-password -refreshToken")

    res.status(200)
    .json(
        new ApiResponse(200,user,"avatar updated successfully")
    )
})

const updateUserCoverImage=asyncHandler(async(req, res)=>{
    // console.log(req.file);
    const coverImageLocalPath=req.file?.path
    if (!coverImageLocalPath) {
        fs.unlinkSync(coverImageLocalPath)
        throw new ApiError(400,"cover image file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        fs.unlinkSync(avatarLocalPath)
        throw new ApiError(400,"cover Image file error in uploading in cloudinary")
    }

    const deleteOldCoverImage=deleteFromCloudinary(req.user?.coverImage)
    if (!deleteOldCoverImage){
        console.log("error in deleting old cover image file");
    }

    const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{coverImage:coverImage.url},
        },
        {new:true}
    ).select("-password -refreshToken")

    res.status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )
})

const getUserChannelProfile=asyncHandler(async (req, res) =>{
    const {username}=req.params

    if(!username?.trim()) throw new ApiError(404, "Username not found")

    const channelDetails =await User.aggregate([
        {
            $match:{username: username.toLowerCase().trim()}
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscribedChannel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribing"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                subscribingCount:{
                    $size:"$subscribing"
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
                email:1,
                username:1,
                fullName:1,
                avatar:1,
                coverImage:1,
                subscriberCount:1,
                subscribingCount:1,
                isCurrentUserSubscribed:1
            }
        }
    ])

    if (channelDetails?.length==0) {
        throw new ApiError(404,"given channel username is wrong")
    }
    res.status(200)
    .json(
        new ApiResponse(200,channelDetails,"Channel details fetched successfully")
    )

})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}