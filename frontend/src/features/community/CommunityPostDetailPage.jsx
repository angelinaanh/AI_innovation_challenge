import { useState, useEffect } from "react";
import { ArrowLeft, MessageCircle, Eye, Send, Bookmark, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/apiClient.js";
import { useAuth } from "../../app/AuthProvider.jsx";
import { TYPE_LABELS } from "./constants.js";
import { MarkdownContent } from "../../components/ui/MarkdownContent.jsx";

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return Math.floor(seconds) + " giây trước";
}

function buildReplyTree(replies) {
  const map = {};
  const roots = [];
  const sorted = [...(replies || [])].sort((a,b) => {
    if (a.is_accepted !== b.is_accepted) return a.is_accepted ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.created_at) - new Date(b.created_at);
  });
  sorted.forEach(r => map[r.id] = { ...r, children: [] });
  sorted.forEach(r => {
    if (r.parent_id && map[r.parent_id]) {
      map[r.parent_id].children.push(map[r.id]);
    } else {
      roots.push(map[r.id]);
    }
  });
  return roots;
}

function ReplyNode({ reply, level, onVote, onAccept, onReplySubmit, activeReplyId, setActiveReplyId }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    await onReplySubmit(reply.id, content);
    setSubmitting(false);
    setContent("");
    setActiveReplyId(null);
  };

  return (
    <div className={`flex flex-col ${level > 0 ? "ml-6 md:ml-10 border-l-2 border-slate-100 pl-4 mt-4" : "surface mt-4 p-4 md:p-6"} ${reply.is_accepted && level === 0 ? "ring-2 ring-emerald-500" : ""}`}>
      <div className="flex items-start gap-3 w-full">
        <div className="avatar h-8 w-8 bg-sky-500 text-xs shrink-0 mt-1">
          {reply.author?.full_name?.charAt(0) || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900">{reply.author?.full_name}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {reply.author?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </span>
              <span className="text-xs text-slate-400">• {timeAgo(reply.created_at)}</span>
            </div>
            {!reply.is_accepted && level === 0 && (
              <button onClick={() => onAccept(reply.id)} className="text-xs font-bold text-slate-400 hover:text-emerald-600 shrink-0">
                Chọn làm đáp án đúng
              </button>
            )}
          </div>
          
          {reply.is_accepted && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-600">
              <CheckCircle2 size={12} />
              Đáp án đúng nhất
            </div>
          )}

          <div className="text-sm text-slate-700">
            <MarkdownContent content={reply.content} />
          </div>

          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50/50 hover:bg-slate-100 rounded-full px-3 py-1 transition-colors">
              <button onClick={() => onVote(reply.id, 1)} className="text-slate-400 hover:text-emerald-500">
                <ThumbsUp size={14} />
              </button>
              <span className={`text-xs font-extrabold ${reply.score > 0 ? "text-emerald-600" : reply.score < 0 ? "text-rose-600" : "text-slate-500"}`}>
                {reply.score || 0}
              </span>
              <button onClick={() => onVote(reply.id, -1)} className="text-slate-400 hover:text-rose-500">
                <ThumbsDown size={14} />
              </button>
            </div>
            <button 
              onClick={() => setActiveReplyId(activeReplyId === reply.id ? null : reply.id)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <MessageCircle size={14} />
              Phản hồi
            </button>
          </div>

          {activeReplyId === reply.id && (
            <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <textarea
                rows={2}
                className="auth-input p-2 resize-none text-sm bg-white"
                placeholder={`Trả lời ${reply.author?.full_name}...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setActiveReplyId(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="primary-button !px-3 !py-1.5 !text-xs"
                  disabled={submitting || !content.trim()}
                >
                  {submitting ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </form>
          )}

          {reply.children?.length > 0 && (
            <div className="flex flex-col">
              {reply.children.map(child => (
                <ReplyNode 
                  key={child.id} 
                  reply={child} 
                  level={level + 1} 
                  onVote={onVote} 
                  onAccept={onAccept}
                  onReplySubmit={onReplySubmit}
                  activeReplyId={activeReplyId}
                  setActiveReplyId={setActiveReplyId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommunityPostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);

  const fetchPost = async () => {
    try {
      const data = await api.getCommunityPost(id);
      setPost(data);
      // Fire and forget view increment
      api.incrementCommunityPostView(id).catch(console.error);
    } catch (err) {
      setError(err.message || "Không thể tải bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setReplying(true);
    try {
      await api.createCommunityReply(id, { content: replyContent });
      setReplyContent("");
      await fetchPost(); // Reload to show new reply
    } catch (err) {
      alert("Lỗi đăng phản hồi: " + err.message);
    } finally {
      setReplying(false);
    }
  };

  const handleNestedReplySubmit = async (parentId, content) => {
    try {
      await api.createCommunityReply(id, { content, parentId });
      await fetchPost(); // Reload to show new reply
    } catch (err) {
      alert("Lỗi đăng phản hồi: " + err.message);
    }
  };

  const handleVotePost = async (vote) => {
    try {
      await api.voteCommunityPost(id, vote, "post");
      await fetchPost();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoteReply = async (replyId, vote) => {
    try {
      await api.voteCommunityPost(replyId, vote, "reply");
      await fetchPost();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      await api.toggleCommunityBookmark(id);
      alert("Đã cập nhật lưu bài viết!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptReply = async (replyId) => {
    try {
      await api.acceptCommunityReply(replyId);
      await fetchPost();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá bài viết này không?")) return;
    setIsDeleting(true);
    try {
      await api.deleteCommunityPost(id);
      navigate(".."); // Go back to community hub
    } catch (err) {
      alert("Lỗi xoá bài viết: " + err.message);
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Đang tải...</div>;
  if (error) return <div className="p-10 text-center font-bold text-red-600">{error}</div>;
  if (!post) return null;

  const typeInfo = TYPE_LABELS[post.post_type] || TYPE_LABELS.question;

  return (
    <div className="mx-auto max-w-7xl pb-20 px-4 xl:px-8">
      <Link to=".." className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} />
        Quay lại cộng đồng
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="surface mb-8 flex flex-col md:flex-row">
        {/* Voting Sidebar */}
        <div className="flex flex-row md:flex-col items-center gap-2 bg-slate-50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
          <button onClick={() => handleVotePost(1)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors">
            <ThumbsUp size={24} />
          </button>
          <span className={`text-lg font-extrabold ${post.score > 0 ? "text-emerald-600" : post.score < 0 ? "text-rose-600" : "text-slate-700"}`}>
            {post.score || 0}
          </span>
          <button onClick={() => handleVotePost(-1)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
            <ThumbsDown size={24} />
          </button>
          <div className="hidden md:block w-full border-t border-slate-200 my-2"></div>
          <button onClick={handleToggleBookmark} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors" title="Lưu bài viết">
            <Bookmark size={24} />
          </button>
        </div>

        {/* Post Content */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className={`rounded-md px-2 py-1 ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {post.grade_level && <span>Lớp {post.grade_level}</span>}
              {post.subject?.name && <span>• {post.subject.name}</span>}
            </div>
            {account?.id === post.author?.id && (
              <button 
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline disabled:opacity-50"
              >
                {isDeleting ? "Đang xoá..." : "Xoá bài viết"}
              </button>
            )}
          </div>
        <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{post.title}</h1>
        
        <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-6">
          <div className="avatar bg-emerald-500">
            {post.author?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{post.author?.full_name}</span>
              <span className="text-xs font-bold text-slate-400">
                {post.author?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-400">{timeAgo(post.created_at)}</div>
          </div>
        </div>

        <MarkdownContent content={post.content} />

          <div className="mt-8 flex items-center gap-4 text-xs font-bold text-slate-500 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-1.5">
              <MessageCircle size={15} />
              {post.replies?.length || 0} phản hồi
            </div>
            <div className="flex items-center gap-1.5">
              <Eye size={15} />
              {post.view_count + 1} lượt xem
            </div>
          </div>
        </div>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-extrabold uppercase text-slate-400">
              {post.replies?.length || 0} PHẢN HỒI
            </h3>
            <div className="flex flex-col gap-4">
              {buildReplyTree(post.replies).map((reply) => (
                <ReplyNode 
                  key={reply.id} 
                  reply={reply} 
                  level={0} 
                  onVote={handleVoteReply} 
                  onAccept={handleAcceptReply}
                  onReplySubmit={handleNestedReplySubmit}
                  activeReplyId={activeReplyId}
                  setActiveReplyId={setActiveReplyId}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleReplySubmit} className="surface flex flex-col gap-3 p-5">
            <label className="text-sm font-bold text-slate-900">Câu trả lời của bạn</label>
            <textarea
              rows={3}
              className="auth-input p-3 resize-none"
              placeholder="Chia sẻ kiến thức hoặc đặt câu hỏi tiếp theo..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="primary-button"
                disabled={replying || !replyContent.trim()}
              >
                {replying ? "Đang gửi..." : (
                  <>
                    <Send size={16} /> Gửi phản hồi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
