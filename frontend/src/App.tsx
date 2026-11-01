import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { PageLoader } from "./components/ui";
import { dashboardPath, useAuth } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout, { ScrollToTop } from "./layouts/PublicLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminBookings, AdminCampaigns, AdminMessages, AdminPayments, AdminScreens, AdminUsers } from "./pages/admin/AdminPages";
import AdvertiserAnalytics from "./pages/advertiser/Analytics";
import AdvertiserBrowse from "./pages/advertiser/Browse";
import CampaignDetail from "./pages/advertiser/CampaignDetail";
import Campaigns from "./pages/advertiser/Campaigns";
import AdvertiserDashboard from "./pages/advertiser/Dashboard";
import NewCampaign from "./pages/advertiser/NewCampaign";
import WalletPage from "./pages/advertiser/WalletPage";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import Signup from "./pages/auth/Signup";
import OwnerBookings from "./pages/owner/Bookings";
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerEarnings from "./pages/owner/Earnings";
import MyScreens from "./pages/owner/MyScreens";
import ScreenForm from "./pages/owner/ScreenForm";
import About from "./pages/public/About";
import Advertise from "./pages/public/Advertise";
import Contact from "./pages/public/Contact";
import Home from "./pages/public/Home";
import HowItWorks from "./pages/public/HowItWorks";
import Legal from "./pages/public/Legal";
import NotFound from "./pages/public/NotFound";
import Pricing from "./pages/public/Pricing";
import ScreenDetailPage from "./pages/public/ScreenDetailPage";
import ScreenOwners from "./pages/public/ScreenOwners";

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return <Navigate to={user ? dashboardPath(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="advertise" element={<Advertise />} />
          <Route path="screens/:id" element={<ScreenDetailPage />} />
          <Route path="screen-owners" element={<ScreenOwners />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="legal/:doc" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="dashboard" element={<DashboardRedirect />} />

        <Route element={<ProtectedRoute roles={["advertiser"]} />}>
          <Route path="advertiser" element={<DashboardLayout />}>
            <Route index element={<AdvertiserDashboard />} />
            <Route path="screens" element={<AdvertiserBrowse />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/new" element={<NewCampaign />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            <Route path="analytics" element={<AdvertiserAnalytics />} />
            <Route path="wallet" element={<WalletPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["screen_owner"]} />}>
          <Route path="owner" element={<DashboardLayout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="screens" element={<MyScreens />} />
            <Route path="screens/new" element={<ScreenForm />} />
            <Route path="screens/:id/edit" element={<ScreenForm />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="earnings" element={<OwnerEarnings />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="screens" element={<AdminScreens />} />
            <Route path="campaigns" element={<AdminCampaigns />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="messages" element={<AdminMessages />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
