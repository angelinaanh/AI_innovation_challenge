import {
  listPosts,
  getPost,
  createPost,
  createReply,
  incrementViewCount,
  votePost,
  voteReply,
  toggleBookmark,
  getBookmarkedPosts,
  acceptReply,
  deletePost
} from "../../services/community/communityService.js";
import { getCommunityStats } from "../../services/community/communityStats.js";

const uid = (request) => request.auth?.profile?.id;
const orgId = (request) => request.auth?.profile?.org_id;

export async function getPosts(request, response, next) {
  try {
    const { gradeLevel, subjectId, type, tab } = request.query;
    const posts = await listPosts(orgId(request), { gradeLevel, subjectId, type, tab });
    response.json({ data: posts });
  } catch (error) {
    next(error);
  }
}

export async function getPostDetail(request, response, next) {
  try {
    const { id } = request.params;
    const post = await getPost(orgId(request), id, uid(request));
    response.json({ data: post });
  } catch (error) {
    next(error);
  }
}

export async function postPost(request, response, next) {
  try {
    const post = await createPost(uid(request), request.body);
    response.status(201).json({ data: post });
  } catch (error) {
    next(error);
  }
}

export async function postReply(request, response, next) {
  try {
    const { id } = request.params;
    const reply = await createReply(uid(request), id, request.body);
    response.status(201).json({ data: reply });
  } catch (error) {
    next(error);
  }
}

export async function postView(request, response, next) {
  try {
    const { id } = request.params;
    await incrementViewCount(id);
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function postVote(request, response, next) {
  try {
    const { id } = request.params;
    const { type, vote } = request.body; // type: 'post' | 'reply', vote: 1 | -1
    if (type === "reply") {
      await voteReply(uid(request), id, vote);
    } else {
      await votePost(uid(request), id, vote);
    }
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function postBookmark(request, response, next) {
  try {
    const { id } = request.params;
    const bookmarked = await toggleBookmark(uid(request), id);
    response.json({ data: { bookmarked } });
  } catch (error) {
    next(error);
  }
}

export async function getBookmarks(request, response, next) {
  try {
    const posts = await getBookmarkedPosts(uid(request));
    response.json({ data: posts });
  } catch (error) {
    next(error);
  }
}

export async function postAccept(request, response, next) {
  try {
    const { id } = request.params;
    await acceptReply(uid(request), id);
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getStats(request, response, next) {
  try {
    const stats = await getCommunityStats(orgId(request));
    response.status(200).json({ data: stats });
  } catch (error) {
    next(error);
  }
}

export async function deletePostHandler(request, response, next) {
  try {
    const { id } = request.params;
    await deletePost(uid(request), id);
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
}
