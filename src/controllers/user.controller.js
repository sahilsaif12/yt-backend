import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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

})
export {
    registerUser,
    loginUser,
    logoutUser

}