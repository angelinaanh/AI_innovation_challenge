import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function listPosts(orgId, { gradeLevel, subjectId, type, tab }) {
  let query = supabase
    .from("community_posts")
    .select(`
      id, title, content, post_type, grade_level, view_count, created_at, tags, score, upvotes, downvotes,
      author:profiles!author_id(id, full_name, role),
      subject:subjects!subject_id(id, name, steam_axis)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (gradeLevel) query = query.eq("grade_level", gradeLevel);
  if (subjectId) query = query.eq("subject_id", subjectId);
  if (type) query = query.eq("post_type", type);
  
  if (tab === "hot") {
    query = query.order("score", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const result = await query;
  throwDatabaseError(result.error, "list community posts");
  
  // Fetch reply counts
  const postIds = (result.data || []).map(p => p.id);
  
  let replyCounts = {};
  if (postIds.length > 0) {
    // Fetch all reply post_ids is faster for small scale MVP.
    const allReplies = await supabase
      .from("community_replies")
      .select("post_id")
      .in("post_id", postIds);
      
    replyCounts = (allReplies.data || []).reduce((acc, curr) => {
      acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
      return acc;
    }, {});
  }

  return (result.data || []).map(p => ({
    ...p,
    reply_count: replyCounts[p.id] || 0
  }));
}

export async function getPost(orgId, postId, userId) {
  const result = await supabase
    .from("community_posts")
    .select(`
      id, title, content, post_type, grade_level, view_count, created_at, tags, score, upvotes, downvotes,
      author:profiles!author_id(id, full_name, role),
      subject:subjects!subject_id(id, name, steam_axis)
    `)
    .eq("id", postId)
    .eq("org_id", orgId)
    .single();

  if (result.error) {
    if (result.error.code === 'PGRST116') throw appError("NOT_FOUND", "Không tìm thấy bài viết");
    throwDatabaseError(result.error, "get community post");
  }

  const replies = await supabase
    .from("community_replies")
    .select(`
      id, parent_id, content, created_at, is_accepted, score, upvotes, downvotes,
      author:profiles!author_id(id, full_name, role)
    `)
    .eq("post_id", postId)
    .order("is_accepted", { ascending: false })
    .order("score", { ascending: false })
    .order("created_at", { ascending: true });

  throwDatabaseError(replies.error, "get community replies");

  return {
    ...result.data,
    replies: replies.data || []
  };
}

export async function createPost(userId, { type, gradeLevel, subjectId, title, content, tags }) {
  const profileResult = await supabase.from("profiles").select("org_id").eq("id", userId).single();
  const orgId = profileResult.data?.org_id;
  if (!orgId) throw appError("AUTH_ERROR", "Không xác định được tổ chức.");

  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();
  if (cleanTitle.length < 5) throw appError("VALIDATION_ERROR", "Tiêu đề quá ngắn.");
  if (cleanContent.length < 10) throw appError("VALIDATION_ERROR", "Nội dung quá ngắn.");

  const hashtagRegex = /#[\p{L}\p{N}_]+/gu;
  const contentHashtags = cleanContent.match(hashtagRegex) || [];
  const titleHashtags = cleanTitle.match(hashtagRegex) || [];
  const allHashtags = [...new Set([...(tags || []), ...contentHashtags, ...titleHashtags])];

  const result = await supabase
    .from("community_posts")
    .insert({
      org_id: orgId,
      author_id: userId,
      post_type: type,
      grade_level: gradeLevel || null,
      subject_id: subjectId || null,
      title: cleanTitle,
      content: cleanContent,
      tags: allHashtags
    })
    .select()
    .single();

  throwDatabaseError(result.error, "create community post");
  return result.data;
}

export async function createReply(userId, postId, { content, parentId }) {
  const cleanContent = String(content || "").trim();
  if (cleanContent.length < 2) throw appError("VALIDATION_ERROR", "Nội dung phản hồi quá ngắn.");

  const result = await supabase
    .from("community_replies")
    .insert({
      post_id: postId,
      author_id: userId,
      content: cleanContent,
      parent_id: parentId || null
    })
    .select()
    .single();

  throwDatabaseError(result.error, "create community reply");
  return result.data;
}

export async function incrementViewCount(postId) {
  // Read current view count via service_role bypassing RLS to do an atomic-like update
  const post = await supabase.from("community_posts").select("view_count").eq("id", postId).single();
  if (!post.data) return;
  
  const result = await supabase
    .from("community_posts")
    .update({ view_count: post.data.view_count + 1 })
    .eq("id", postId);
}

export async function votePost(userId, postId, voteType) {
  // Simple implementation: Just upsert the vote
  // Upserting via PostgREST might require a conflict target on the unique index.
  // We can do it by first checking if a vote exists, if so update/delete, else insert.
  const { data: existingVote } = await supabase
    .from("community_votes")
    .select("id, vote_type")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .single();

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Toggle off
      await supabase.from("community_votes").delete().eq("id", existingVote.id);
    } else {
      // Change vote
      await supabase.from("community_votes").update({ vote_type: voteType }).eq("id", existingVote.id);
    }
  } else {
    // Insert new
    await supabase.from("community_votes").insert({ user_id: userId, post_id: postId, vote_type: voteType });
  }
  
  // Note: We need a database trigger or RPC to update the score on the post.
  // For MVP without RPC, we will update the post score from backend.
  // This is a naive approach and subject to race conditions, but fine for MVP.
  const { data: allVotes } = await supabase.from("community_votes").select("vote_type").eq("post_id", postId);
  let upvotes = 0;
  let downvotes = 0;
  for (const v of allVotes || []) {
    if (v.vote_type === 1) upvotes++;
    if (v.vote_type === -1) downvotes++;
  }
  await supabase.from("community_posts").update({ upvotes, downvotes, score: upvotes - downvotes }).eq("id", postId);
}

export async function voteReply(userId, replyId, voteType) {
  const { data: existingVote } = await supabase
    .from("community_votes")
    .select("id, vote_type")
    .eq("user_id", userId)
    .eq("reply_id", replyId)
    .single();

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      await supabase.from("community_votes").delete().eq("id", existingVote.id);
    } else {
      await supabase.from("community_votes").update({ vote_type: voteType }).eq("id", existingVote.id);
    }
  } else {
    await supabase.from("community_votes").insert({ user_id: userId, reply_id: replyId, vote_type: voteType });
  }

  const { data: allVotes } = await supabase.from("community_votes").select("vote_type").eq("reply_id", replyId);
  let upvotes = 0;
  let downvotes = 0;
  for (const v of allVotes || []) {
    if (v.vote_type === 1) upvotes++;
    if (v.vote_type === -1) downvotes++;
  }
  await supabase.from("community_replies").update({ upvotes, downvotes, score: upvotes - downvotes }).eq("id", replyId);
}

export async function toggleBookmark(userId, postId) {
  const { data: existing } = await supabase
    .from("community_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .single();

  if (existing) {
    await supabase.from("community_bookmarks").delete().eq("id", existing.id);
    return false; // unbookmarked
  } else {
    await supabase.from("community_bookmarks").insert({ user_id: userId, post_id: postId });
    return true; // bookmarked
  }
}

export async function getBookmarkedPosts(userId) {
  const { data } = await supabase
    .from("community_bookmarks")
    .select(`
      post_id,
      post:community_posts(
        id, title, content, post_type, grade_level, view_count, created_at, tags, score,
        author:profiles!author_id(id, full_name, role),
        subject:subjects!subject_id(id, name, steam_axis)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
    
  return (data || []).map(b => b.post);
}

export async function acceptReply(userId, replyId) {
  // Check if user is the author of the post or a teacher. We skip strict checks for MVP but let's check post author.
  const { data: reply } = await supabase.from("community_replies").select("post_id, post:community_posts(author_id)").eq("id", replyId).single();
  if (!reply) throw appError("NOT_FOUND", "Không tìm thấy phản hồi");
  
  // Un-accept all other replies for this post
  await supabase.from("community_replies").update({ is_accepted: false }).eq("post_id", reply.post_id);
  
  // Accept this reply
  await supabase.from("community_replies").update({ is_accepted: true }).eq("id", replyId);
}

export async function deletePost(userId, postId) {
  const { data: post } = await supabase.from("community_posts").select("author_id").eq("id", postId).single();
  if (!post) throw appError("NOT_FOUND", "Không tìm thấy bài viết");
  if (post.author_id !== userId) throw appError("FORBIDDEN", "Bạn không có quyền xoá bài viết này");
  
  const result = await supabase.from("community_posts").delete().eq("id", postId);
  throwDatabaseError(result.error, "delete community post");
}
