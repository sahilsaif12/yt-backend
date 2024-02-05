import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription=asyncHandler(async(req,res) => {
    const {userId}=req.params

    if(userId?.trim()=="") {
        throw new ApiError(400,"channel user id required")
    }
    const isSubscriber=await Subscription.findOne({
        subscribedChannel: new mongoose.Types.ObjectId(userId),
        subscriber: new mongoose.Types.ObjectId(req.user?._id)
    })

    
    try {
        if (isSubscriber) {
            await Subscription.findByIdAndDelete(isSubscriber._id)
        }
        else{
            await Subscription.create(
                {
                    subscribedChannel:new mongoose.Types.ObjectId(userId),
                    subscriber:new mongoose.Types.ObjectId(req.user?._id)
                }
            )
        }
    } catch (error) {
        throw new ApiError(400,error.message)
    }

    res.status(200)
    .json(
        new ApiResponse(200,{},"channel subscribed/unsubscribed successfully")
    )
})

const getSubscriberList=asyncHandler(async(req, res)=>{
    const {userId}=req.params

    const subscriberList=await Subscription.aggregate([
        {
            $match:{subscribedChannel:new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                        }
                        
                    }
                ]
            }
        },
        {
            $unwind:"$subscriber"
        },
        {
            $group:{
                _id:"$subscribedChannel",
                subscribers:{
                    $addToSet:"$subscriber"
                }
            }
        }
    ])

    if (subscriberList?.length==0) {
        throw new ApiError(404,"given userId of the channel is wrong")
    }

    res.status(200).
    json(
        new ApiResponse(200,subscriberList[0],"Subscriber list fetched successfully")
    )
})

const getSubscribingList=asyncHandler(async(req, res)=>{
    const {userId}=req.params

    const subscribingList=await Subscription.aggregate([
        {
            $match:{subscriber:new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup:{
                from:"users",
                localField:"subscribedChannel",
                foreignField:"_id",
                as:"subscribed",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                        }
                        
                    }
                ]
            }
        },
        {
            $unwind:"$subscribed"
        },
        {
            $group:{
                _id:"$subscriber",
                subscribed_list:{
                    $addToSet:"$subscribed"
                }
            }
        }
    ])

    if (subscribingList?.length==0) {
        throw new ApiError(404,"given userId of the channel is wrong")
    }

    res.status(200).
    json(
        new ApiResponse(200,subscribingList[0],"Subscriber list fetched successfully")
    )
})

export {
    toggleSubscription,
    getSubscriberList,
    getSubscribingList

}