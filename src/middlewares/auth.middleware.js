import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const verifyJwt=async(req, res, next)=>{
    const accessToken=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if(!accessToken) {
        throw new ApiError(401,"No access token available")
    }

    let decodedToken=null
    await jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET_KEY,(err,decoded) => {
        if (err) {
            // Check if the error is due to token expiration
            if (err.name === "TokenExpiredError") {
                res.status(400).json({msg:"access token expired.  refresh the token or log in again"})
                throw new ApiError(401,"access token has expired")
            } 
        }else{
            decodedToken=decoded
        }
        })

    const user = await User.findById(decodedToken?._id)
    if (!user) {
        throw new ApiError(401,"Unauthorized token")
    }

    req.user = user
    next()
}

export { verifyJwt}