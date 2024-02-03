import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"

const verifyJwt=async(req, res, next)=>{
    const accessToken=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if(!accessToken) {
        throw new ApiError(401,"No access token available")
    }
    
    const decodedToken=await jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET_KEY)

    const user = await User.findById(decodedToken?._id)
    if (!user) {
        throw new ApiError(401,"Unauthorized token")
    }

    req.user = user
    next()
}

export { verifyJwt}