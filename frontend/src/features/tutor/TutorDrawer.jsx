import { useState } from "react";
import { Bot, MessageCircleQuestion, X } from "lucide-react";

import { TutorConversation } from "./TutorConversation.jsx";

// In-lesson launcher: a floating button that opens the Tutor as a modal drawer.
// Shares the conversation body with the global right-side dock (TutorDock).
export function TutorDrawer({ skillNodeId, skillNodeName }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="tutor-launcher" onClick={() => setOpen(true)} aria-label="Mở AI Tutor">
        <MessageCircleQuestion size={22} />
        <span>Hỏi AI Tutor</span>
      </button>

      {open && (
        <div className="tutor-layer" role="dialog" aria-modal="true" aria-label="AI Tutor">
          <button className="tutor-backdrop" onClick={() => setOpen(false)} aria-label="Đóng AI Tutor" />
          <aside className="tutor-drawer">
            <header className="tutor-header">
              <div className="tutor-brand-icon"><Bot size={22} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-950">EduOne AI Tutor</h2>
                  <span className="tutor-online-dot" title="Sẵn sàng" />
                </div>
                <p className="truncate text-xs font-bold text-slate-500">{skillNodeName}</p>
              </div>
              <button className="icon-button inline-grid" onClick={() => setOpen(false)} aria-label="Đóng AI Tutor" title="Đóng">
                <X size={20} />
              </button>
            </header>
            <TutorConversation
              key={skillNodeId}
              skillNodeId={skillNodeId}
              skillNodeName={skillNodeName}
              active={open}
            />
          </aside>
        </div>
      )}
    </>
  );
}
