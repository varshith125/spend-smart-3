import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddExpense = lazy(() => import('./pages/AddExpense'));
const History = lazy(() => import('./pages/History'));
const Insights = lazy(() => import('./pages/Insights'));
const Settings = lazy(() => import('./pages/Settings'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Loans = lazy(() => import('./pages/Loans'));
const Reports = lazy(() => import('./pages/Reports'));
const CreditCards = lazy(() => import('./pages/CreditCards'));
const NotFound = lazy(() => import('./pages/NotFound'));

function LoadingScreen() {
  return (
    <div className="bg-gradient-mesh min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
    </div>
  );
}

function LazyPage({ Component }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component />
    </Suspense>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppLayout({ children }) {
  return (
    <div className="bg-gradient-mesh min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-screen">
        {children}
      </main>
      <Navbar />
    </div>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LazyPage Component={Login} />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <LazyPage Component={Signup} />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={Dashboard} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-expense"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={AddExpense} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={History} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={Insights} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={Settings} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={Subscriptions} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={Loans} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={Reports} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/credit-cards"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageWrapper><LazyPage Component={CreditCards} /></PageWrapper>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<LazyPage Component={NotFound} />} />
      </Routes>
    </AnimatePresence>
  );
}
