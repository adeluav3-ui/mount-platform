// src/App.jsx - UPDATED WITH AUTHCHECK
import React, { useEffect } from 'react'; // ADD useEffect here!
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseProvider, useSupabase } from './context/SupabaseContext';
import { SettingsProvider } from './context/SettingsContext';
import AuthCheck from './components/AuthCheck';
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
import LandingPage from './pages/LandingPage';

// Move AppRoutes inside the Providers
function AppRoutes() {
  const { user, loading } = useSupabase();


  console.log('AppRoutes render:', {
    user,
    loading,
    path: window.location.pathname,
    hash: window.location.hash,
    fullUrl: window.location.href
  });

  if (loading) {
    console.log('Loading state');
    return (
      <div className="min-h-screen bg-naijaGreen flex items-center justify-center">
        <p className="text-white text-4xl font-bold animate-pulse">Mount</p>
      </div>
    );
  }

  if (!user) {
    console.log('No user, showing public routes');
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />


        {/* Login/Signup screen */}
        <Route path="/login" element={<Login />} />

        {/* Catch-all redirect to welcome screen */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  console.log('User exists, showing main routes');

  return (
    <Routes>
      {/* TEST ROUTE - Add this first */}
      <Route path="/test-route" element={<div className="p-8 text-2xl">Test Route Works!</div>} />

      {/* Payment verification route */}
      <Route path="/payment/pending" element={<PaymentPending />} />

      {/* Bank Transfer Payment */}
      <Route path="/payment/bank-transfer/:jobId" element={<BankTransferPayment />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="/payment/:jobId" element={<PaymentPage />} />

      {/* Add Review Route */}
      <Route path="/review/:jobId" element={<ReviewSubmission />} />

      {/* Add Company Reviews Route */}
      <Route path="/company/:companyId/reviews" element={<CompanyReviewsPage />} />

      {/* Admin Routes */}
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

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

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
          <AuthCheck>
            <AppRoutes />
          </AuthCheck>
        </SettingsProvider>
      </SupabaseProvider>
    </Router>
  );
}