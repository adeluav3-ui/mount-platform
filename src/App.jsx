// src/App.jsx - UPDATED WITH SEO PAGES
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SupabaseProvider, useSupabase } from './context/SupabaseContext';
import { SettingsProvider } from './context/SettingsContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PaymentPage from './components/payment/PaymentPage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminStats from './components/admin/AdminStats';
import BankTransferPayment from './components/payment/BankTransferPayment';
import PendingApprovals from './components/admin/PendingApprovals';
import DisbursementRequests from './components/admin/DisbursementRequests';
import PayoutManagement from './components/admin/PayoutManagement';
import JobManagement from './components/admin/JobManagement';
import UserManagement from './components/admin/UserManagement';
import AdminPaymentVerification from './components/admin/AdminPaymentVerification';
import CompanyReviewsPage from './components/company/CompanyReviewsPage';
import AdminSettings from './components/admin/AdminSettings';
import PaymentPending from './components/payment/PaymentPending';
import ReviewSubmission from './components/review/ReviewSubmission';
import VerificationReview from './components/admin/VerificationReview';
import WelcomeScreen from './components/WelcomeScreen';
import ServicesHubPage from './components/seo/ServicesHubPage';
import ServicePage from './components/seo/ServicePage';

// Public routes wrapper - accessible without authentication
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />

      {/* Login/Signup screen */}
      <Route path="/login" element={<Login />} />

      {/* NEW SEO PAGES - START */}
      <Route path="/services" element={<ServicesHubPage />} />
      <Route path="/services/:serviceSlug" element={<ServicePage />} />
      {/* NEW SEO PAGES - END */}

      {/* Catch-all redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Protected routes wrapper - requires authentication
function ProtectedRoutes() {
  const { user } = useSupabase();
  const location = useLocation();

  // If user is null but we're in ProtectedRoutes, something went wrong
  // This shouldn't happen if AuthWrapper is working correctly
  if (!user) {
    console.warn('ProtectedRoutes accessed without user, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <Routes>
      {/* Payment routes */}
      <Route path="/payment/pending" element={<PaymentPending />} />
      <Route path="/payment/bank-transfer/:jobId" element={<BankTransferPayment />} />

      {/* Main routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="/payment/:jobId" element={<PaymentPage />} />

      {/* Review routes */}
      <Route path="/review/:jobId" element={<ReviewSubmission />} />
      <Route path="/company/:companyId/reviews" element={<CompanyReviewsPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminDashboard />}>
        <Route index element={<AdminStats />} />
        <Route path="stats" element={<AdminStats />} />
        <Route path="approvals" element={<PendingApprovals />} />
        <Route path="payments" element={<AdminPaymentVerification />} />
        <Route path="verifications" element={<VerificationReview />} />
        <Route path="disbursements" element={<DisbursementRequests />} />
        <Route path="payouts" element={<PayoutManagement />} />
        <Route path="jobs" element={<JobManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch-all for authenticated users - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Main router wrapper that handles authentication state
function AppRouter() {
  const { user, loading, session } = useSupabase();
  const location = useLocation();

  console.log('AppRouter render:', {
    user: user?.email,
    loading,
    hasSession: !!session,
    pathname: location.pathname
  });

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-naijaGreen to-darkGreen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Mount</h2>
          <p className="opacity-80">Please wait...</p>
        </div>
      </div>
    );
  }

  // Determine if current route is public
  // Determine if current route is public
  const isPublicRoute =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/services') || // Allow all /services/* pages
    location.pathname === '/how-it-works' || // We'll add these later
    location.pathname === '/for-customers' ||
    location.pathname === '/for-providers';

  // If no user and not on a public route, show login screen
  if (!user && !isPublicRoute) {
    console.log('No user on protected route, redirecting to login');
    return (
      <div className="min-h-screen bg-gradient-to-br from-naijaGreen to-darkGreen flex items-center justify-center">
        <div className="text-center text-white max-w-md p-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Session Expired</h2>
          <p className="mb-6 opacity-90">Please login again to continue.</p>
          <button
            onClick={() => {
              window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`;
            }}
            className="bg-white text-naijaGreen font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Login Again
          </button>
        </div>
      </div>
    );
  }

  // If user exists on login page, redirect to dashboard
  if (user && location.pathname === '/login') {
    console.log('User on login page, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // If user exists on landing page, redirect to dashboard
  if (user && location.pathname === '/') {
    console.log('User on landing page, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Render appropriate routes based on auth state
  return user ? <ProtectedRoutes /> : <PublicRoutes />;
}

// Main App component
export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <SupabaseProvider>
        <SettingsProvider>
          <AppRouter />
        </SettingsProvider>
      </SupabaseProvider>
    </Router>
  );
}