import { AdminLoginForm } from "@/components/AdminLoginForm";

export const metadata = {
  title: "Agent Login",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-4">
      <AdminLoginForm />
    </div>
  );
}
