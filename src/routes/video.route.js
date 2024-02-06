import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { postVideo, updateViewsCount } from "../controllers/video.controller.js";

const router=Router()
router.use(verifyJwt)

router.route("/postVideo").post(upload.fields([
    {
        name:"video",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    },
]), postVideo),

router.route("/updateViewsCount/:videoId").post(updateViewsCount)
export default router
