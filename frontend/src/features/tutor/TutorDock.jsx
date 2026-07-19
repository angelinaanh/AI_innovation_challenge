import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircleQuestion, X } from "lucide-react";

import { api } from "../../lib/apiClient.js";
import { useMediaQuery } from "../../lib/useMediaQuery.js";
import { TutorConversation } from "./TutorConversation.jsx";

const MIN_WIDTH = 340;
const MAX_WIDTH = 640;

// Global right-side AI Tutor dock: a sliding drawer that can be dragged wider or
// narrower and hidden entirely. On desktop it pushes page content (the shell
// pads its right side); on mobile it overlays full-width with a backdrop.
export function TutorDock({ open, width, onOpenChange, onWidthChange, nodes = [] }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const resizing = useRef(false);

  // `nodes` (dashboard preview) seeds the picker instantly; on first open we
  // fetch the full learning path so every topic is selectable.
  const [fetchedNodes, setFetchedNodes] = useState(null);
  useEffect(() => {
    if (!open || fetchedNodes) return undefined;
    const controller = new AbortController();
    api.getPath(controller.signal)
      .then((data) => setFetchedNodes(data?.nodes ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, [open, fetchedNodes]);
  const sourceNodes = fetchedNodes ?? nodes;

  // Tutor is grounded per skill node, so the dock needs a topic that actually
  // has an approved lesson. Prefer nodes with a published lesson.
  const available = useMemo(() => {
    const withLesson = sourceNodes.filter(
      (node) => node.hasPublishedLesson ?? node.status !== "locked",
    );
    return withLesson.length ? withLesson : sourceNodes;
  }, [sourceNodes]);

  const [nodeId, setNodeId] = useState(null);
  useEffect(() => {
    if (available.length && !available.some((node) => node.id === nodeId)) {
      setNodeId(available[0].id);
    }
  }, [available, nodeId]);

  const activeNode = available.find((node) => node.id === nodeId) || null;

  function startResize(event) {
    if (!isDesktop) return;
    event.preventDefault();
    resizing.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    function onMove(moveEvent) {
      if (!resizing.current) return;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - moveEvent.clientX));
      onWidthChange(next);
    }
    function onUp() {
      resizing.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  if (!open) {
    return (
      <button className="tutor-dock-tab" onClick={() => onOpenChange(true)} aria-label="Mở AI Tutor">
        <MessageCircleQuestion size={18} aria-hidden="true" />
        <span>AI Tutor</span>
      </button>
    );
  }

  return (
    <>
      {!isDesktop && (
        <button className="tutor-dock-backdrop" aria-label="Đóng AI Tutor" onClick={() => onOpenChange(false)} />
      )}
      <aside className="tutor-dock" style={{ width: isDesktop ? width : "100%" }} aria-label="AI Tutor">
        <div
          className="tutor-dock-resize"
          onPointerDown={startResize}
          role="separator"
          aria-orientation="vertical"
          title="Kéo để đổi độ rộng"
        />
        <header className="tutor-dock-header">
          <div className="tutor-brand-icon"><Bot size={20} aria-hidden="true" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-950">AI Tutor</h2>
              <span className="tutor-online-dot" title="Sẵn sàng" />
            </div>
            <select
              className="tutor-dock-select"
              value={nodeId || ""}
              onChange={(event) => setNodeId(event.target.value)}
              aria-label="Chọn bài học để hỏi"
            >
              {available.length === 0 && <option value="">Chưa có bài để hỏi</option>}
              {available.map((node) => (
                <option key={node.id} value={node.id}>{node.name}</option>
              ))}
            </select>
          </div>
          <button
            className="icon-button inline-grid"
            onClick={() => onOpenChange(false)}
            aria-label="Ẩn AI Tutor"
            title="Ẩn"
          >
            <X size={18} />
          </button>
        </header>

        {activeNode ? (
          <TutorConversation
            key={activeNode.id}
            skillNodeId={activeNode.id}
            skillNodeName={activeNode.name}
            active={open}
          />
        ) : (
          <div className="tutor-dock-empty">
            <p>
              Chọn một bài học ở trên để bắt đầu hỏi AI Tutor. Tutor chỉ trả lời dựa trên
              bài đã được giáo viên duyệt.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
