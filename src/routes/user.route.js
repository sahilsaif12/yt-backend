import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails } from "../controllers/user.controller.js";
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
router.route("/updateDetails").post(verifyJwt,updateAccountDetails)
export default router