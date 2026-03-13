import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import Kanban from './pages/Kanban';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MyProjects from './pages/MyProjects';
import MyProfile from './pages/MyProfile';
import TaskWorkPage from './pages/TaskWorkPage';
import SetupPassword from './pages/SetupPassword';
import ProjectReviews from './pages/ProjectReviews';
import Settings from './pages/Settings';
import JoinWorkspace from './pages/JoinWorkspace';
import ProjectAuditLog from './pages/ProjectAuditLog';

// Components & Contexts
import Layout from './components/Layout';
import { ToastProvider } from './contexts/ToastContext';
import { SocketProvider } from './contexts/SocketContext';
import GlobalNotificationListener from './components/GlobalNotificationListener';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4 text-white flex justify-center items-center min-h-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4 text-white flex justify-center items-center min-h-screen">Loading...</div>;
  // If user exists, send them to dashboard
  return user ? <Navigate to="/" replace /> : children;
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
          <Routes>
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
              <Route path="/" element={<Dashboard />} />
              <Route path="/my-projects" element={<MyProjects />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/project/:id" element={<ProjectDetails />} />
              <Route path="/project/:projectId/reviews" element={<ProjectReviews />} />
              <Route path="/project/:projectId/audit-log" element={<ProjectAuditLog />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/task/:id/work" element={<TaskWorkPage />} />
              <Route path="/project/:projectId/settings" element={<Settings />} />
              <Route path="/setup-password" element={<SetupPassword />} />
            </Route>

            {/* Catch-all Route for 404 - MUST BE LAST */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

      </SocketProvider>
    </ToastProvider>
  );
}

export default App;