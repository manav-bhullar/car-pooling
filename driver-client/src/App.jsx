import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import ActiveTrip from './pages/ActiveTrip';
import { SpeedInsights } from "@vercel/speed-insights/react";
import './index.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Public Route component (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/active-trip" element={<ProtectedRoute><ActiveTrip /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SpeedInsights />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
