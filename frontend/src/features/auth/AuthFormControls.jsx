import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function FormField({ label, icon: Icon, error, className = "", ...inputProps }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-black text-slate-700">{label}</span>
      <span className="relative block">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
        <input
          {...inputProps}
          className={`auth-input ${Icon ? "pl-11" : "pl-3.5"} ${error ? "border-rose-400" : ""}`}
        />
      </span>
      {error && <span className="mt-1.5 block text-xs font-bold text-rose-600">{error}</span>}
    </label>
  );
}

export function PasswordField({ label = "Mật khẩu", error, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-slate-700">{label}</span>
      <span className="relative block">
        <input
          {...inputProps}
          type={visible ? "text" : "password"}
          className={`auth-input px-3.5 pr-12 ${error ? "border-rose-400" : ""}`}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          title={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {error && <span className="mt-1.5 block text-xs font-bold text-rose-600">{error}</span>}
    </label>
  );
}

export function FormAlert({ children, tone = "error" }) {
  if (!children) return null;
  const classes = tone === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-700";
  return <div className={`rounded-lg border px-4 py-3 text-sm font-bold leading-5 ${classes}`} role="alert">{children}</div>;
}
