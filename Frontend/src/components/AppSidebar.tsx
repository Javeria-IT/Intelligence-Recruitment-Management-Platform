import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import {
  Briefcase, LayoutDashboard, FileText, Bookmark, Bell, Calendar, User, Search, Plus, Users, Sparkles, LogOut,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const candidateItems = [
  { title: "Dashboard", url: "/candidate", icon: LayoutDashboard, end: true },
  { title: "Browse Jobs", url: "/candidate/jobs", icon: Search },
  { title: "Applications", url: "/candidate/applications", icon: FileText },
  { title: "Saved Jobs", url: "/candidate/saved", icon: Bookmark },
  { title: "Interviews", url: "/candidate/interviews", icon: Calendar },
  { title: "Notifications", url: "/candidate/notifications", icon: Bell },
  { title: "Profile", url: "/candidate/profile", icon: User },
];

const recruiterItems = [
  { title: "Dashboard", url: "/recruiter", icon: LayoutDashboard, end: true },
  { title: "Manage Jobs", url: "/recruiter/jobs", icon: Briefcase },
  { title: "Applicants", url: "/recruiter/applicants", icon: Users },
  { title: "Interviews", url: "/recruiter/interviews", icon: Calendar },
  { title: "Notifications", url: "/recruiter/notifications", icon: Bell },
  { title: "Profile", url: "/recruiter/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = user?.role === "recruiter" ? recruiterItems : candidateItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <NavLink to="/" className="flex items-center gap-2 px-2 py-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold tracking-tight">IR</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">Intelligence Recruitment Platform</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Intelligent Recruitment</span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>{user?.role === "recruiter" ? "Recruiter" : "Candidate"}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink to={item.url} end={item.end}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login"); }} className="justify-start">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
