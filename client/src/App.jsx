import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Components & Contexts
import Layout from './components/Layout';
import { ToastProvider } from './contexts/ToastContext';
import { SocketProvider } from './contexts/SocketContext';
import GlobalNotificationListener from './components/GlobalNotificationListener';

// 🚀 LAZY LOADED PAGES
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

// 🆕 NEW INFORMATIONAL PAGES
const Help = lazy(() => import('./pages/Help'));
const Docs = lazy(() => import('./pages/Docs'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));

// ⏳ Global Fallback Loader
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
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
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const IndexRoute = () => {
  const { loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0f172a]" />;
  // Render Home directly so logged-in users can see the updated Home UI
  return <Home />;
};

function App() {
  return (
    <ToastProvider>
      <SocketProvider>
        <GlobalNotificationListener />

        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<IndexRoute />} />

              {/* Informational Pages */}
              <Route path="/help" element={<Help />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />

              {/* Public Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
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

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;