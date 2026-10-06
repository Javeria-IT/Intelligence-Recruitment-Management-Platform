import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNavbar } from "@/components/TopNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export const DashboardLayout = ({ requiredRole }: { requiredRole: Role }) => {
  const { user, loading, otpPending } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (otpPending) return <Navigate to="/verify-otp" replace />;
  if (user.role !== requiredRole) {
    return <Navigate to={user.role === "recruiter" ? "/recruiter" : "/candidate"} replace />;
  }
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
