import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlware.js";
import {
    getAllLikedCommunity,
    getAllLikedVideos,
    toggleCommunityPostLike,
    toggleVideoLike,
    toogleCommentLike,
} from "../controllers/like.contoller.js";

const router = Router()
router.route("/toggle-video/:videoId").post(verifyJWT, toggleVideoLike)
router.route("/toggle-commu/:postId").post(verifyJWT, toggleCommunityPostLike)
router.route("/liked-vid").get(verifyJWT, getAllLikedVideos)
router.route("/liked-commu").get(verifyJWT, getAllLikedCommunity)
router.route("/toggle-comment/:commentId").post(verifyJWT, toogleCommentLike)


export default router;