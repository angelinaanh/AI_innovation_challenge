import { useState, useEffect } from "react";
import { Search, Plus, MessageCircle, Eye, Flame, Clock, HelpCircle, Bookmark, TrendingUp, Trophy, ChevronRight } from "lucide-react";
import { TYPE_LABELS } from "./constants.js";
import { MarkdownContent } from "../../components/ui/MarkdownContent.jsx";
import { Link } from "react-router-dom";
import { api } from "../../lib/apiClient.js";
import { CreatePostModal } from "./CreatePostModal.jsx";

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

export function CommunityHubPage() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ trendingTags: [], topTeachers: [] });
  const [loading, setLoading] = useState(true);
  const [activeGrade, setActiveGrade] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState("hot"); // hot, new, unanswered
  const [activeView, setActiveView] = useState("all"); // all, bookmarks, grade_X

  const fetchPosts = async () => {
    setLoading(true);
    try {
      if (activeView === "bookmarks") {
        const data = await api.getCommunityBookmarks();
        setPosts(data);
      } else {
        const gradeLevel = activeView.startsWith("grade_") ? activeView.replace("grade_", "") : "";
        const data = await api.getCommunityPosts({ gradeLevel, tab: activeTab });
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeView, activeTab]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getCommunityStats();
        if (data) {
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  const filteredPosts = posts.filter((post) => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen gap-6">
      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm bài viết, môn học, tag..."
              className="auth-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="shrink-0">
            <select
              className="auth-input px-4 pr-8 bg-white"
              value={activeView}
              onChange={(e) => setActiveView(e.target.value)}
            >
              <option value="all">Tất cả bài viết</option>
              <option value="bookmarks">Đã lưu</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <option key={grade} value={`grade_${grade}`}>
                  Lớp {grade}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="primary-button shrink-0 sm:ml-auto"
          >
            <Plus size={18} />
            Đăng bài
          </button>
        </div>

        {/* FEATURED TIPS */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase text-slate-500">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Featured Tips
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                id: "tip-1",
                grade: "Lớp 1",
                subject: "Tiếng Việt",
                title: "Mẹo giúp con lớp 1 học bảng chữ cái nhanh hơn",
                author: "Cô Hạnh",
                role: "Lecturer"
              },
              {
                id: "tip-2",
                grade: "Lớp 5",
                subject: "Tiếng Việt",
                title: "Hướng dẫn: Viết đoạn văn tả cảnh cho lớp 5",
                author: "Cô Mai",
                role: "Lecturer"
              },
              {
                id: "tip-3",
                grade: "Lớp 12",
                subject: "Hóa học",
                title: "Cách cân bằng phương trình hóa học lớp 12",
                author: "Cô Trang",
                role: "Lecturer"
              }
            ].map((tip) => (
              <div key={tip.id} className="surface flex flex-col justify-between p-5 transition-shadow hover:shadow-lg cursor-pointer">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{tip.grade}</span>
                    <span>• {tip.subject}</span>
                  </div>
                  <h3 className="mb-4 text-base font-extrabold text-slate-900 line-clamp-3">
                    {tip.title}
                  </h3>
                </div>
                <div className="text-xs font-bold text-slate-500">
                  {tip.author} <span className="font-normal text-slate-400">• {tip.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SMART FEED TABS */}
        <div className="mb-6 flex items-center gap-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("hot")}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors ${
              activeTab === "hot" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Flame size={16} className={activeTab === "hot" ? "text-orange-500" : ""} /> Đang hot
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors ${
              activeTab === "new" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Clock size={16} className={activeTab === "new" ? "text-blue-500" : ""} /> Mới nhất
          </button>
          <button
            onClick={() => setActiveTab("unanswered")}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors ${
              activeTab === "unanswered" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <HelpCircle size={16} className={activeTab === "unanswered" ? "text-rose-500" : ""} /> Chưa giải đáp
          </button>
        </div>

        <section className="mb-10">
          {loading ? (
            <div className="text-center text-sm font-bold text-slate-500 py-10">Đang tải...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="surface flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
                <MessageCircle size={32} />
              </div>
              <p className="text-sm font-bold text-slate-900">Chưa có bài viết nào</p>
              <p className="mt-1 text-xs text-slate-500">Hãy là người đầu tiên chia sẻ kiến thức.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredPosts.map((post) => {
                const typeInfo = TYPE_LABELS[post.post_type] || TYPE_LABELS.question;
                return (
                  <Link
                    key={post.id}
                    to={`./${post.id}`}
                    className="surface group flex gap-4 p-5 transition-shadow hover:shadow-lg"
                  >
                    <div className="avatar shrink-0 bg-violet-500">
                      {post.author?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                        <span className={`rounded-md px-2 py-1 ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {post.grade_level && <span>Lớp {post.grade_level}</span>}
                        {post.subject?.name && <span>• {post.subject.name}</span>}
                        <span>•</span>
                        <span className="text-slate-900">{post.author?.full_name}</span>
                        <span className="text-slate-400">{post.author?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</span>
                        <span>•</span>
                        <span>{timeAgo(post.created_at)}</span>
                      </div>
                      
                      <h3 className="mb-1 text-base font-extrabold text-slate-900 group-hover:text-emerald-700">
                        {post.title}
                      </h3>
                      <div className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        <MarkdownContent content={post.content} />
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={15} />
                          {post.reply_count}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye size={15} />
                          {post.view_count}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                          <span className={post.score > 0 ? "text-emerald-600" : post.score < 0 ? "text-rose-600" : ""}>{post.score || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Right Sidebar */}
      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-6 space-y-8">
          
          {/* Trending Tags */}
          <div className="surface p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <TrendingUp size={16} className="text-rose-500" />
              Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {(stats?.trendingTags || []).map(tag => (
                <button key={tag} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Top Teachers */}
          <div className="surface p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Trophy size={16} className="text-amber-500" />
              Top Giáo viên Tuần
            </h3>
            <div className="space-y-4">
              {(stats?.topTeachers || []).map((teacher, idx) => (
                <div key={teacher.id || teacher.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "⭐"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">{teacher.name}</div>
                    <div className="truncate text-xs font-bold text-slate-400 capitalize">{teacher.role || "Giáo viên"}</div>
                  </div>
                  <div className="text-sm font-extrabold text-emerald-600">+{teacher.score}</div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </aside>

      {showCreateModal && (
        <CreatePostModal
          suggestedTags={stats.trendingTags}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}
