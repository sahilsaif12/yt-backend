import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, postVideo, updateVideo, updateViewsCount } from "../controllers/video.controller.js";

const router=Router()
router.use(verifyJwt)

router
    .route("/")
    .post(upload.fields([
        {
            name:"video",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        },
    ]), postVideo)
    .get(getAllVideos)

router
    .route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"),updateVideo)
    .delete(deleteVideo)


router.route("/updateViewsCount/:videoId").patch(updateViewsCount)
export default router
