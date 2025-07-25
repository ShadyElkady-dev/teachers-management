import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TeachersPage from './pages/TeachersPage';
import OperationsPage from './pages/OperationsPage';
import AccountsPage from './pages/AccountsPage';
import ExpensesPage from './pages/ExpensesPage';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Styles
import './styles/globals.css';

// Utils
import { isOnline } from './utils/helpers';
import { PERMISSIONS } from './context/AuthContext';

// مكون التطبيق الرئيسي
function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!isOnline());

  // مراقبة حالة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // محاكاة تحميل التطبيق
    const initializeApp = async () => {
      try {
        // هنا يمكن إضافة أي عمليات تهيئة مطلوبة
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // إظهار شاشة التحميل
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
ادارة حسابات المدرسين</h2>
          <p className="mt-2 text-gray-600">
            يرجى الانتظار قليلاً
          </p>
        </div>
      </div>
    );
  }

  // إذا لم يكن مسجل دخول، اعرض صفحة تسجيل الدخول
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // إذا كان مسجل دخول، اعرض التطبيق الرئيسي
  return (
    <AppProvider>
      <Router>
        {/* إشعار عدم الاتصال بالإنترنت */}
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">📶</span>
              <span className="font-medium">
                لا يوجد اتصال بالإنترنت - قد لا تعمل بعض الميزات بشكل صحيح
              </span>
            </div>
          </div>
        )}

        <Layout>
          <Routes>
            {/* الصفحة الرئيسية - لوحة التحكم */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* لوحة التحكم - متاحة للجميع */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* صفحة المدرسين - متاحة للجميع */}
            <Route 
              path="/teachers" 
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TEACHERS}>
                  <TeachersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* صفحة العمليات - متاحة للجميع */}
            <Route 
              path="/operations" 
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_OPERATIONS}>
                  <OperationsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* صفحة الحسابات - فقط للأدمن */}
            <Route 
              path="/accounts" 
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PAYMENTS}>
                  <AccountsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* صفحة المصروفات - فقط للأدمن */}
            <Route 
              path="/expenses" 
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_EXPENSES}>
                  <ExpensesPage />
                </ProtectedRoute>
              } 
            />
            
            {/* صفحة 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>

        {/* مكون الإشعارات */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{
            direction: 'rtl'
          }}
          toastOptions={{
            // إعدادات افتراضية لجميع الإشعارات
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '12px 16px',
              maxWidth: '400px',
              direction: 'rtl',
              textAlign: 'right'
            },
            
            // إعدادات مخصصة لكل نوع
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            
            loading: {
              duration: Infinity,
              style: {
                background: '#3b82f6',
              },
            },
          }}
        />
      </Router>
    </AppProvider>
  );
}

// مكون صفحة 404
const NotFoundPage = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          404
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          الصفحة غير موجودة
        </h2>
        <p className="text-gray-600 mb-8">
          عذراً، لا يمكن العثور على الصفحة التي تبحث عنها
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="btn btn-primary mx-2"
          >
            العودة للخلف
          </button>
          <button
            onClick={logout}
            className="btn btn-secondary mx-2"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};

// المكون الرئيسي للتطبيق
function App() {
  return (
    <div className="App rtl" dir="rtl">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </div>
  );
}

export default App;