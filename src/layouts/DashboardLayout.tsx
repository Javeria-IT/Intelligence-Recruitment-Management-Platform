import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNavbar } from "@/components/TopNavbar";
import { useAuth, Role } from "@/contexts/AuthContext";

export const DashboardLayout = ({ requiredRole }: { requiredRole: Role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
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
