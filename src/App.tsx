import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import AuthPage from './pages/Auth';
import ResearchDetail from './pages/ResearchDetail';
import History from './pages/History';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0c] text-white">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/research/:id"
          element={
            <ProtectedRoute>
              <ResearchDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}
