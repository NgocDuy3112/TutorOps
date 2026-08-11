import { AuthForm } from "./AuthForm";
import { AuthLayout } from "./AuthLayout";

export function SignupPage({ onSignedUp }: { onSignedUp: () => void }) {
  return (
    <AuthLayout
      title="Tạo tài khoản giáo viên"
      description="Bắt đầu quản lý lớp học của bạn."
    >
      <AuthForm mode="signup" onSuccess={onSignedUp} />
    </AuthLayout>
  );
}
