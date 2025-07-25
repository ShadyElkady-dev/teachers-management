import React from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

// مكون حماية المسارات
const ProtectedRoute = ({ 
  children, 
  requiredPermission = null, 
  requiredRole = null,
  fallbackComponent = null 
}) => {
  const { isAuthenticated, user, hasPermission, hasRole, isLoading } = useAuth();

  // إذا كان النظام لا يزال يحمل
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن مسجل دخول
  if (!isAuthenticated || !user) {
    return null; // سيتم إعادة التوجيه إلى صفحة تسجيل الدخول في App.js
  }

  // التحقق من الصلاحية المطلوبة
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallbackComponent || <UnauthorizedAccess />;
  }

  // التحقق من الدور المطلوب
  if (requiredRole && !hasRole(requiredRole)) {
    return fallbackComponent || <UnauthorizedAccess />;
  }

  // إذا تم اجتياز جميع الفحوصات
  return children;
};

// مكون عدم وجود صلاحية
const UnauthorizedAccess = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-6xl mb-6">🚫</div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            غير مصرح بالوصول
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            عذراً، لا تملك الصلاحية للوصول إلى هذه الصفحة.
            <br />
            حسابك الحالي: <strong>{user?.name}</strong>
            <br />
            نوع الحساب: <strong>
              {user?.role === 'admin' ? 'مدير' : 'سكرتارية'}
            </strong>
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="btn-mobile btn-secondary w-full"
            >
              <span className="text-lg">↩️</span>
              العودة للخلف
            </button>
            
            <button
              onClick={logout}
              className="btn-mobile btn-primary w-full"
            >
              <span className="text-lg">🚪</span>
              تسجيل الخروج
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المدير
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون حماية المكونات الفرعية
export const PermissionGate = ({ 
  permission, 
  role, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasRole } = useAuth();

  // التحقق من الصلاحية
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // التحقق من الدور
  if (role && !hasRole(role)) {
    return fallback;
  }

  return children;
};

// Hook مخصص للتحقق من الصلاحيات
export const usePermissionCheck = () => {
  const { hasPermission, hasRole, user } = useAuth();

  const canViewPrices = () => hasPermission('view_operation_prices');
  const canManagePayments = () => hasPermission('view_payments');
  const canManageExpenses = () => hasPermission('view_expenses');
  const canDeleteOperations = () => hasPermission('delete_operation');
  const canEditOperations = () => hasPermission('edit_operation');
  const canManageTeachers = () => hasPermission('edit_teacher');
  const canViewFinancialData = () => hasPermission('view_financial_data');
  const isAdminUser = () => hasRole('admin');
  const isSecretaryUser = () => hasRole('secretary');

  return {
    canViewPrices,
    canManagePayments,
    canManageExpenses,
    canDeleteOperations,
    canEditOperations,
    canManageTeachers,
    canViewFinancialData,
    isAdminUser,
    isSecretaryUser,
    user
  };
};

export default ProtectedRoute;