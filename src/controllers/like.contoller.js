import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asynchandler.js"
import { Like } from "../models/like.model.js";



// 
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    try {
        if (!videoId && !isValidObjectId(videoId)) {
            throw new ApiError(400, "video id required!!")

        }

        if (!req.user?._id && !isValidObjectId(req.user?._id)) {
            throw new ApiError(404, "Unauthorized Request!!")
        }
        const conditionForLike = { likedBy: req.user?._id, video: videoId }

        const isLiked = await Like.findOne(conditionForLike);

        if (!isLiked) {
            const createLike = await Like.create(conditionForLike)
            console.log("CreateLike", createLike);
            return res.status(200)
                .json(new ApiResponse(200, createLike, "Video Liked Successfully"))

        }
        else {
            const disLike = await Like.findOneAndDelete(isLiked._id);

            return res.status(200)
                .json(new ApiResponse(200, disLike, "Video Unliked  Successfully"))
        }


    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!!")
    }

})
// 

const toogleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    try {
        if (!commentId && !isValidObjectId(commentId)) {
            throw new ApiError(400, "video id required!!");
        }

        if (!req.user?._id && !isValidObjectId(req.user?._id)) {
            throw new ApiError(404, "Unauthorized Request!!");
        }
        const conditionForLike = { likedBy: req.user?._id, comment: commentId }
        const isLiked = await Like.findOne(conditionForLike);
        if (!isLiked) {
            const createLike = await Like.create(
                conditionForLike
            );
            return res.status(200)
                .json(new ApiResponse(200, createLike, "Comment Liked Successfully"))

        } else {
            const disLike = await Like.findByIdAndDelete(isLiked._id)
            return res.status(200)
                .json(new ApiResponse(200, disLike, "Comment Unliked  Successfully"))
        }


    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!!")
    }
})


// 
const toggleCommunityPostLike = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    try {
        if (!postId && !isValidObjectId(postId)) {
            throw new ApiError(400, "Post id required!!")

        }

        if (!req.user?._id && !isValidObjectId(req.user?._id)) {
            throw new ApiError(404, "Unauthorized Request!!")
        }
        // 
        const conditionForLike = { likedBy: req.user?._id, communityPost: postId };
        const isPostLiked = await Like.findOne(conditionForLike);
        if (!isPostLiked) {
            const postLiked = await Like.create(conditionForLike)

            return res.status(200)
                .json(new ApiResponse(200, postLiked, "Post Liked Successfully"))
        }
        else {
            const disLiked = await Like.findOneAndDelete(conditionForLike);
            return res.status(200)
                .json(new ApiResponse(200, disLiked, "Post disliked Successfully"))
        }

    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!!")
    }
})
// 


const getAllLikedVideos = asyncHandler(async (req, res) => {
    const { userId } = req.user?._id;
    try {
        if (!userId && !isValidObjectId(req.user?._id)) {
            throw new ApiError(400, "Unauthorized Request!!");
        }
        // ##more optimized
        const allLikedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: req.user?._id,
                    video: {
                        $exists: true,
                    },
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "allVideos"
                }
            },
            {
                $unwind: {
                    path: "$allVideos"
                }
            },
            // either u can use or it will give full video details
            // {
            //     $project: {
            //         _id: "$allVideos._id",
            //         title: "$allVideos.title",
            //         description: "$allVideos.description",
            //         videoFile: "$allVideos.videoFile",
            //         duration:"$allVideos.duration"
            //     }
            // }

        ]);
        // ##less optimized and easy way
        // const allLikedVideos = await Like.find({
        //     LikedBy: userId,
        //     video: { 
        //         $exists: true ,

        //     },
        // });

        if (!allLikedVideos.length) {
            // throw new ApiResponse(202, allLikedVideos, ` No Liked Videos ${allLikedVideos.length}`);
            throw new ApiError(402, "no videos found")
        }
        return res.status(200)
            .json(new ApiResponse(200, allLikedVideos, `Fetched Successfully ${allLikedVideos.length}`))


    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!!")
    }

})
// 


// extra end point for commuinty Post 
const getAllLikedCommunity = asyncHandler(async (req, res) => {
    const { page, limit, sort } = req.query;

    try {
        if (!req.user?._id && !isValidObjectId(req.user?._id)) {
            throw new ApiError(400, "Unauthorized Request!!");
        }
        const communititesAggrgate =  Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user?._id),
                    communityPost: {
                        $exists: true,
                    }
                }
            },
            {
                $lookup: {
                    from: "communityposts",
                    localField: "communityPost",
                    foreignField: "_id",
                    as: "allCommunitesPost"
                }
            },
            {
                $unwind: {
                    path: "$allCommunitesPost"
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { ownerId: "$allCommunitesPost.owner" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$ownerId"]
                                }
                            }
                        },
                        {
                            $project: {
                                password: 0,
                                refreshToken: 0,
                                email: 0,
                                watchHistory: 0,
                                createdAt: 0,
                                updatedAt: 0,
                                coverImage: 0,
                                username: 0,
                            }
                        }
                    ],
                    as: "createdUser"
                }
            },
            {
                $unwind: {
                    path: "$createdUser"
                }
            },
            {
                $lookup: {
                    from: "likes",
                    let: { communityPostId: "$communityPost" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$communityPost", "$$communityPostId"]
                                }
                            }
                        },
                        {
                            $count: "likesCount"
                        }
                    ],
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likesCount: { $ifNull: [{ $arrayElemAt: ["$likes.likesCount", 0] }, 0] }
                }
            },
            // 
            {
                $lookup: {
                    from: "comments",
                    let: {
                        communityPostId: "$allCommunitesPost._id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$communityPost", "$$communityPostId"] }
                            }
                        },
                        {
                            $count: "commentsCount"
                        }
                    ],
                    as: "comments"
                }
            },
            {
                $addFields: {
                    commentsCount: { $ifNull: [{ $arrayElemAt: ["$comments.commentsCount", 0] }, 0] }
                }
            },
            {
                $project: {
                    communityPost: "$allCommunitesPost",
                    createdUser: 1,
                    likesCount: 1,
                    commentsCount: 1,
                }
            }

        ]);

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: {
                createdAt: parseInt(sort) || 1
            }

        };
        // if (!communititesAggrgate.length) {
        //     throw new ApiError(500, "Something went wrong!!");
        // }
        const allCommunitiyPost = await Like.aggregatePaginate(
            communititesAggrgate,
            options
        )
        if (!allCommunitiyPost || allCommunitiyPost.docs.length == 0) {
            res.status(200)
                .json(new ApiResponse(200, allCommunitiyPost, `Fetched Successfully ${allCommunitiyPost.docs.length}`))
        }


        return res.status(200)
            .json(new ApiResponse(200, allCommunitiyPost, `Fetched Successfully ${allCommunitiyPost.docs.length}`))
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!!")
    }

})

export {
    toggleVideoLike,
    toggleCommunityPostLike,
    getAllLikedVideos,
    getAllLikedCommunity,
    toogleCommentLike
}