import { useState, useEffect, useRef } from "react";
import { X, Image as ImageIcon, Film, XCircle, Loader2 } from "lucide-react";
import { api } from "../../lib/apiClient.js";
import { supabase } from "../../lib/supabaseClient.js";

const POST_TYPES = [
  { value: "question", label: "Câu hỏi" },
  { value: "tip", label: "Mẹo hay" },
  { value: "guide", label: "Hướng dẫn" },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function CreatePostModal({ onClose, onCreated, suggestedTags = [] }) {
  const [form, setForm] = useState({
    type: "question",
    gradeLevel: "",
    subjectId: "",
    title: "",
    content: "",
  });
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let canceled = false;
    async function loadSubjects() {
      try {
        const data = await api.getCommunitySubjects();
        if (!canceled) setSubjects(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadSubjects();
    return () => { canceled = true; };
  }, []);

  const visibleSubjects = form.gradeLevel
    ? subjects.filter((s) => s.grade_level === Number(form.gradeLevel))
    : subjects;

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Kích thước file không được vượt quá 20MB.");
      return;
    }

    if (!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/")) {
      setError("Chỉ hỗ trợ file hình ảnh hoặc video.");
      return;
    }

    setFile(selectedFile);
    setError(null);

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("video"); // Just a placeholder string for videos
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async () => {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("community_media")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error("Lỗi tải file lên: " + uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from("community_media")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let finalContent = form.content;
      
      if (file) {
        const publicUrl = await uploadFile();
        if (publicUrl) {
          if (file.type.startsWith("image/")) {
            finalContent += `\n\n![Đính kèm](${publicUrl})`;
          } else {
            finalContent += `\n\n[Video đính kèm](${publicUrl})`;
          }
        }
      }

      const payload = {
        type: form.type,
        title: form.title,
        content: finalContent,
        gradeLevel: form.gradeLevel ? Number(form.gradeLevel) : null,
        subjectId: form.subjectId || null,
      };
      await api.createCommunityPost(payload);
      onCreated();
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi đăng bài.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="surface w-full max-w-[700px] overflow-hidden rounded-[24px] bg-white shadow-2xl animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between border-b border-slate-100/80 px-8 py-5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Chia sẻ với cộng đồng</h2>
          <button
            onClick={onClose}
            className="icon-button -mr-2 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-600 border border-rose-100">
              <XCircle size={18} />
              {error}
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Loại bài</label>
              <select
                className="auth-input px-4 font-semibold text-slate-700 bg-slate-50 border-slate-200 focus:bg-white"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {POST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Lớp</label>
              <select
                className="auth-input px-4 font-semibold text-slate-700 bg-slate-50 border-slate-200 focus:bg-white"
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value, subjectId: "" })}
              >
                <option value="">Tất cả các lớp</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>Lớp {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Môn học</label>
              <select
                className="auth-input px-4 font-semibold text-slate-700 bg-slate-50 border-slate-200 focus:bg-white disabled:opacity-50"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                disabled={visibleSubjects.length === 0}
              >
                <option value="">Tất cả môn</option>
                {visibleSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Tiêu đề</label>
            <input
              type="text"
              required
              placeholder="Câu hỏi hoặc chủ đề của bạn?"
              className="auth-input px-5 py-3 text-lg font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-slate-50 border-slate-200 focus:bg-white transition-all"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="mb-6 relative">
            <label className="mb-2 block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Nội dung</label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
              <textarea
                required
                rows={6}
                placeholder="Chia sẻ chi tiết — bạn đã thử gì, đang mắc ở đâu..."
                className="w-full bg-transparent p-5 text-sm text-slate-800 placeholder:text-slate-400 resize-none outline-none"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              
              {/* Media Preview Area */}
              {file && (
                <div className="px-5 pb-3">
                  <div className="relative inline-block rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    {previewUrl === "video" ? (
                      <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Film size={32} />
                      </div>
                    ) : (
                      <img src={previewUrl} alt="Preview" className="h-24 w-auto rounded-lg object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute -right-2 -top-2 rounded-full bg-white text-slate-400 shadow-md hover:text-rose-500 transition-colors"
                    >
                      <XCircle size={20} className="fill-white" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Hashtag Suggestions */}
              {(() => {
                const match = form.content.match(/#[\p{L}\p{N}_]*$/u);
                if (!match) return null;
                const search = match[0].toLowerCase();
                const matches = suggestedTags.filter(t => t.toLowerCase().startsWith(search));
                if (matches.length === 0) return null;
                return (
                  <div className="px-5 pb-3 flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-400 py-1">Gợi ý thẻ:</span>
                    {matches.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, content: form.content.replace(/#[\p{L}\p{N}_]*$/u, tag + " ") });
                        }}
                        className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-extrabold text-violet-600 hover:bg-violet-100 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Toolbar */}
              <div className="flex items-center justify-between border-t border-slate-200/60 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <ImageIcon size={16} className="text-emerald-500" />
                    Thêm ảnh/video
                  </button>
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Hỗ trợ Markdown cơ bản</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="primary-button min-w-[140px] shadow-emerald-500/20 shadow-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
              disabled={loading || !form.title.trim() || !form.content.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : "Đăng bài"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
