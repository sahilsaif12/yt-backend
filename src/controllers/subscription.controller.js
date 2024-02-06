import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    // Extract userId from request parameters
    const { userId } = req.params;

    // Check if userId is provided, if not, throw a 400 Bad Request error
    if (!userId?.trim()) {
        throw new ApiError(400, "channel user id required");
    }

    // Check if the current user is already a subscriber to the specified channel
    const isSubscriber = await Subscription.findOne({
        subscribedChannel: new mongoose.Types.ObjectId(userId),
        subscriber: new mongoose.Types.ObjectId(req.user?._id),
    });

    try {
        // If the user is already a subscriber, unsubscribe them
        if (isSubscriber) {
            await Subscription.findByIdAndDelete(isSubscriber._id);
        } else {
            // If the user is not a subscriber, subscribe them to the channel
            await Subscription.create({
                subscribedChannel: new mongoose.Types.ObjectId(userId),
                subscriber: new mongoose.Types.ObjectId(req.user?._id),
            });
        }
    } catch (error) {
        // Catch and handle any errors that occur during the subscription toggle process
        throw new ApiError(400, error.message);
    }

    
    res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Channel subscribed/unsubscribed successfully"
        )
    );
});


const getSubscriberList=asyncHandler(async(req, res)=>{
    const {userId}=req.params

    const subscriberList=await Subscription.aggregate([
        // Stage 1: Match subscriptions with the provided userId
        {
            $match:{subscribedChannel:new mongoose.Types.ObjectId(userId)}
        },
         // Stage 2: Lookup users collection to get subscriber details
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                // Sub-pipeline to project specific fields from users collection
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
        // Stage 3: Unwind the "subscriber" array to get individual subscriber documents (as we have single object so converting it  [{}]->{})
        {
            $unwind:"$subscriber"
        },
        // Stage 4: Group subscribers by  channel id
        {
            $group:{
                _id:"$subscribedChannel",
                subscribers:{
                    $addToSet:"$subscriber"
                }
            }
        }
    ])

        // Check if the subscriberList is empty (userId not found)
    if (subscriberList?.length==0) {
        throw new ApiError(404,"given userId of the channel is wrong")
    }

    res.status(200).
    json(
        new ApiResponse(200,subscriberList[0],"Subscriber list fetched successfully")
    )
})

const getSubscribingList = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const subscribingList = await Subscription.aggregate([
        // Stage 1: Match subscriptions for the specified user
        {
            $match: { subscriber: new mongoose.Types.ObjectId(userId) }
        },
        // Stage 2: Lookup detailed information about subscribed channels from 'users' collection
        {
            $lookup: {
                from: "users",
                localField: "subscribedChannel",
                foreignField: "_id",
                as: "subscribed",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        // Stage 3: Unwind the "subscribed" array to get individual subscriber documents 
        // (as we have a single object, this step transforms it from [{}] to {})
        {
            $unwind: "$subscribed"
        },
        // Stage 4: Group the results by subscriber and create a list of subscribed channels
        {
            $group: {
                _id: "$subscriber",
                subscribed_list: {
                    $addToSet: "$subscribed"
                }
            }
        }
    ]);

    // Checking if the result is empty, and throwing an error if the given userId is incorrect
    if (subscribingList?.length == 0) {
        throw new ApiError(404, "Given userId of the channel is wrong");
    }

    res.status(200).json(
        new ApiResponse(200, subscribingList[0], "Subscriber list fetched successfully")
    );
});


export {
    toggleSubscription,
    getSubscriberList,
    getSubscribingList

}