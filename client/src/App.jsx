import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Components & Contexts (Keep these static for immediate app initialization)
import Layout from './components/Layout';
import { ToastProvider } from './contexts/ToastContext';
import { SocketProvider } from './contexts/SocketContext';
import GlobalNotificationListener from './components/GlobalNotificationListener';

// 🚀 LAZY LOADED PAGES (Code Splitting)
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const Kanban = lazy(() => import('./pages/Kanban'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MyProjects = lazy(() => import('./pages/MyProjects'));
const MyProfile = lazy(() => import('./pages/MyProfile'));
const TaskWorkPage = lazy(() => import('./pages/TaskWorkPage'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));
const ProjectReviews = lazy(() => import('./pages/ProjectReviews'));
const Settings = lazy(() => import('./pages/Settings'));
const JoinWorkspace = lazy(() => import('./pages/JoinWorkspace'));
const ProjectAuditLog = lazy(() => import('./pages/ProjectAuditLog'));
const GlobalSearch = lazy(() => import('./pages/GlobalSearch'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ResourcePlanning = lazy(() => import('./pages/ResourcePlanning'));
const MyWork = lazy(() => import('./pages/MyWork'));
const ProjectAssets = lazy(() => import('./pages/ProjectAssets'));
const Timesheet = lazy(() => import('./pages/Timesheet'));
const IssuesTracker = lazy(() => import('./pages/IssuesTracker'));

// ⏳ Global Fallback Loader (Shows while downloading the requested page chunk)
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  // If user exists, send them to dashboard
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const IndexRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0f172a]" />; // Smooth blank screen while checking auth
  // If logged in -> Go to Dashboard. If logged out -> Show Landing Page.
  return user ? <Navigate to="/dashboard" replace /> : <Home />;
};

function App() {
  return (
    <ToastProvider>
      {/* Wrap the app in SocketProvider so the connection is available everywhere.
        It sits inside ToastProvider so socket listeners can trigger toasts.
      */}
      <SocketProvider>

        {/* The invisible watcher that catches global server events and fires popups */}
        <GlobalNotificationListener />

        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans">
          {/* 🛡️ WRAP ROUTES IN SUSPENSE */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<IndexRoute />} />

              {/* Public Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />

              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />

              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Universal Route (Accessible to both logged-in and logged-out users) */}
              <Route path="/join-workspace/:token" element={<JoinWorkspace />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/workload" element={<ResourcePlanning />} />
                <Route path="/my-work" element={<MyWork />} />
                <Route path="/search" element={<GlobalSearch />} />
                <Route path="/my-projects" element={<MyProjects />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/project/:id" element={<ProjectDetails />} />
                <Route path="/project/:projectId/reviews" element={<ProjectReviews />} />
                <Route path="/project/:projectId/audit-log" element={<ProjectAuditLog />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="/task/:id/work" element={<TaskWorkPage />} />
                <Route path="/project/:projectId/settings" element={<Settings />} />
                <Route path="/setup-password" element={<SetupPassword />} />
                <Route path="/project/:projectId/assets" element={<ProjectAssets />} />
                <Route path="/timesheet" element={<Timesheet />} />
                <Route path="/project/:projectId/issues" element={<IssuesTracker />} />
              </Route>

              {/* Catch-all Route for 404 - MUST BE LAST */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>

      </SocketProvider>
    </ToastProvider>
  );
}

export default App;