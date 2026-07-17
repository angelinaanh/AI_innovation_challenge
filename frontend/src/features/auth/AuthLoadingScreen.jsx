import { Brand } from "../../components/ui/Brand.jsx";

export function AuthLoadingScreen({ label = "Đang xác thực phiên đăng nhập" }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f8f7] px-5" aria-label={label}>
      <div className="text-center">
        <div className="flex justify-center"><Brand /></div>
        <div className="mx-auto mt-6 h-1.5 w-36 overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-600" />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
      </div>
    </main>
  );
}
