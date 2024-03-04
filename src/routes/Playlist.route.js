import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getAllPlaylists, getPlaylistById, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router=Router()

router.use(verifyJwt)

router.route("/")
            .post(createPlaylist)
            .get(getAllPlaylists)

router.route("/:playlistId")
            .get(getPlaylistById)
            .patch(updatePlaylist)
            .delete(deletePlaylist)

router.route("/add/:playlistId/:videoId").patch(addVideoToPlaylist)
router.route("/remove/:playlistId/:videoId").patch(removeVideoFromPlaylist)

export default router