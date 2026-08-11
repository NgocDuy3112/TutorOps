import { AuthForm } from "./AuthForm";
import { AuthLayout } from "./AuthLayout";

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  return (
    <AuthLayout
      title="Đăng nhập giáo viên"
      description=""
    >
      <AuthForm mode="login" onSuccess={onLoggedIn} />
    </AuthLayout>
  );
}
