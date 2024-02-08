import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router=Router()

router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser)

router.route("/login").post(loginUser)

//@ secure routes

router.route("/logout").get(verifyJwt,logoutUser)
router.route("/refreshToken").get(refreshAccessToken)
router.route("/changePassword").post(verifyJwt,changeCurrentPassword)
router.route("/currentUser").get(verifyJwt,getCurrentUser)
router.route("/updateDetails").patch(verifyJwt,updateAccountDetails)
router.route("/updateAvatar").patch(verifyJwt,upload.single("avatar"),updateUserAvatar)
router.route("/updateCoverImage").patch(verifyJwt,upload.single("coverImage"),updateUserCoverImage)
router.route("/channel/:channelId").get(verifyJwt,getUserChannelProfile)
router.route("/watchHistory").get(verifyJwt,getWatchHistory)
export default router