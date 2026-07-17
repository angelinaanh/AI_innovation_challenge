import { Clock3, LogOut, RefreshCw, ShieldAlert, UserCog } from "lucide-react";

import { useAuth } from "../../app/AuthProvider.jsx";
import { AuthLayout } from "./AuthLayout.jsx";

const roleNames = {
  teacher: "Giảng viên",
  parent: "Phụ huynh",
  admin: "Quản trị viên",
};

export function PendingAccountPage() {
  const { account, signOut } = useAuth();
  return (
    <AuthLayout eyebrow="Trạng thái tài khoản" title="Đang chờ xác nhận của người giám hộ" description="Quyền học tập sẽ được mở sau khi yêu cầu đồng ý được xác minh.">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <Clock3 size={28} />
        <p className="mt-4 text-sm font-black">{account?.fullName || "Tài khoản học sinh"}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-amber-800">Trạng thái PENDING được khóa ở backend; tải lại trang không thể bỏ qua bước này.</p>
      </div>
      <button type="button" className="auth-secondary-button mt-6" onClick={signOut}><LogOut size={18} />Đăng xuất</button>
    </AuthLayout>
  );
}

export function InactiveAccountPage() {
  const { signOut } = useAuth();
  return (
    <AuthLayout eyebrow="Trạng thái tài khoản" title="Tài khoản hiện không hoạt động" description="Liên hệ quản trị viên EduOne để kiểm tra trạng thái tài khoản.">
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900"><ShieldAlert size={28} /><p className="mt-4 text-sm font-bold">Quyền truy cập đã bị chặn ở server.</p></div>
      <button type="button" className="auth-secondary-button mt-6" onClick={signOut}><LogOut size={18} />Đăng xuất</button>
    </AuthLayout>
  );
}

export function RoleWorkspacePage() {
  const { account, signOut } = useAuth();
  return (
    <AuthLayout eyebrow="Tài khoản đã xác thực" title={`Xin chào, ${account?.fullName || roleNames[account?.role] || "bạn"}`} description={`${roleNames[account?.role] || "Vai trò"} · ${account?.email || ""}`}>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-800"><UserCog size={28} /><p className="mt-4 text-sm font-bold">Phiên đăng nhập và vai trò đã được server xác minh.</p></div>
      <button type="button" className="auth-secondary-button mt-6" onClick={signOut}><LogOut size={18} />Đăng xuất</button>
    </AuthLayout>
  );
}

export function UnauthorizedPage() {
  const { signOut } = useAuth();
  return (
    <AuthLayout eyebrow="Phân quyền" title="Bạn không có quyền mở trang này" description="EduOne kiểm tra vai trò ở cả route và backend API.">
      <button type="button" className="auth-secondary-button" onClick={signOut}><LogOut size={18} />Đăng xuất</button>
    </AuthLayout>
  );
}

export function AuthUnavailablePage() {
  const { error, refreshAccount, signOut } = useAuth();
  return (
    <AuthLayout eyebrow="Kết nối tài khoản" title="Chưa tải được hồ sơ của bạn" description="Phiên đăng nhập vẫn được giữ. Hãy thử kết nối lại sau ít phút.">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <ShieldAlert size={28} />
        <p className="mt-4 text-sm font-bold leading-6">{error || "Dịch vụ tài khoản tạm thời chưa phản hồi."}</p>
      </div>
      <button type="button" className="auth-primary-button mt-6" onClick={refreshAccount}><RefreshCw size={18} />Thử lại</button>
      <button type="button" className="auth-secondary-button mt-4" onClick={signOut}><LogOut size={18} />Đăng xuất</button>
    </AuthLayout>
  );
}
