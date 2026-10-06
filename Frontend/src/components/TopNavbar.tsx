import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useMyNotifications } from "@/api/notifications";
import { resolveUploadUrl } from "@/lib/api";

export const TopNavbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const notifPath = user?.role === "recruiter" ? "/recruiter/notifications" : "/candidate/notifications";
  const profilePath = user?.role === "recruiter" ? "/recruiter/profile" : "/candidate/profile";
  const { data } = useMyNotifications();
  const unread = data?.unreadCount ?? 0;

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur sticky top-0 z-30 flex items-center px-4 gap-3">
      <SidebarTrigger />
      <div className="hidden md:flex items-center flex-1 max-w-md ml-2">
      </div>
      <div className="flex-1 md:hidden" />
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" asChild className="relative">
        <Link to={notifPath}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground border-0">
              {unread}
            </Badge>
          )}
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:bg-muted rounded-lg p-1 pr-3 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src={resolveUploadUrl(user?.profileImage)} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-medium leading-tight">{user?.fullName}</span>
              <span className="text-[10px] text-muted-foreground leading-tight capitalize">{user?.role}</span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate(profilePath)}>
            <UserIcon className="h-4 w-4 mr-2" /> Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
