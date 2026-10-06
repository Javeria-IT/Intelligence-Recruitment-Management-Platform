import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes} from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import JobListings from "./pages/candidate/JobListings";
import JobDetails from "./pages/candidate/JobDetails";
import Applications from "./pages/candidate/Applications";
import Profile from "./pages/candidate/Profile";
import SavedJobs from "./pages/candidate/SavedJobs";
import Notifications from "./pages/candidate/Notifications";
import Interviews from "./pages/candidate/Interviews";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import PostJob from "./pages/recruiter/PostJob";
import ManageJobs from "./pages/recruiter/ManageJobs";
import Applicants from "./pages/recruiter/Applicants";
import RecruiterInterviews from "./pages/recruiter/RecruiterInterviews";
import RecruiterNotifications from "./pages/recruiter/RecruiterNotifications";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              <Route path="/candidate" element={<DashboardLayout requiredRole="candidate" />}>
                <Route index element={<CandidateDashboard />} />
                <Route path="jobs" element={<JobListings />} />
                <Route path="jobs/:id" element={<JobDetails />} />
                <Route path="applications" element={<Applications />} />
                <Route path="saved" element={<SavedJobs />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="interviews" element={<Interviews />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              <Route path="/recruiter" element={<DashboardLayout requiredRole="recruiter" />}>
                <Route index element={<RecruiterDashboard />} />
                <Route path="post" element={<PostJob />} />
                <Route path="edit/:id" element={<PostJob />} />
                <Route path="jobs" element={<ManageJobs />} />
                <Route path="applicants" element={<Applicants />} />
                <Route path="interviews" element={<RecruiterInterviews />} />
                <Route path="notifications" element={<RecruiterNotifications />} />
                <Route path="profile" element={<RecruiterProfile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
