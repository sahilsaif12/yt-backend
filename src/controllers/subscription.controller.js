import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription=asyncHandler(async(req,res) => {
    const {username,isSubscribed}=req.body

    const user=await User.findOne({username})
    
    if (!user) {
        throw new ApiError(404,"channel not found")
    }
    if (isSubscribed) {
        await Subscription.deleteOne(
            {
                subscribedChannel:user._id,
                subscriber:req.user?._id
            }
        )
    }
    else{
        await Subscription.create(
            {
                subscribedChannel:user._id,
                subscriber:req.user?._id
            }
        )
    }

    res.status(200)
    .json(
        new ApiResponse(200,{},"channel subscribed/unsubscribed successfully")
    )
})


export {
    toggleSubscription
}