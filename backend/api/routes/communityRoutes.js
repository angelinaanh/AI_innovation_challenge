import { Router } from "express";
import {
  getPosts,
  getPostDetail,
  postPost,
  postReply,
  postView,
  postVote,
  postBookmark,
  getBookmarks,
  postAccept,
  getStats,
  deletePostHandler
} from "../controllers/communityController.js";
import { getSubjects } from "../controllers/classroomController.js";

const router = Router();

router.get("/subjects", getSubjects);

router.get("/posts", getPosts);
router.get("/stats", getStats);
router.get("/bookmarks", getBookmarks);
router.post("/posts", postPost);
router.get("/posts/:id", getPostDetail);
router.delete("/posts/:id", deletePostHandler);
router.post("/posts/:id/replies", postReply);
router.post("/posts/:id/view", postView);
router.post("/posts/:id/vote", postVote);
router.post("/posts/:id/bookmark", postBookmark);
router.post("/replies/:id/accept", postAccept);

export default router;
