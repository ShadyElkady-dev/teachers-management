import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import { formatDateTime } from '../../utils/helpers';

const UserProfile = () => {
  const { user, logout, USER_ROLES } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const getUserRoleLabel = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'مدير النظام';
      case USER_ROLES.SECRETARY:
        return 'سكرتارية';
      default:
        return 'مستخدم';
    }
  };

  const getUserRoleIcon = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return '👑';
      case USER_ROLES.SECRETARY:
        return '📝';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case USER_ROLES.SECRETARY:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* زر الملف الشخصي */}
      <div className="relative">
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="الملف الشخصي"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.name?.charAt(0) || '👤'}
            </span>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs text-gray-500">{getUserRoleLabel(user?.role)}</div>
          </div>
        </button>
      </div>

      {/* نافذة الملف الشخصي */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="الملف الشخصي"
        size="medium"
      >
        <div className="space-y-6">
          
          {/* معلومات المستخدم الأساسية */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">
                {user?.name?.charAt(0) || '👤'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>

          {/* نوع الحساب */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{getUserRoleIcon(user?.role)}</span>
              <div className={`px-4 py-2 rounded-full border ${getRoleColor(user?.role)}`}>
                <span className="font-medium">{getUserRoleLabel(user?.role)}</span>
              </div>
            </div>
          </div>

          {/* تفاصيل الحساب */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">اسم المستخدم:</span>
                <div className="font-medium">{user?.username}</div>
              </div>
              <div>
                <span className="text-gray-500">معرف المستخدم:</span>
                <div className="font-medium font-mono text-xs">{user?.id}</div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">وقت تسجيل الدخول:</span>
                <div className="font-medium">
                  {user?.loginTime ? formatDateTime(user.loginTime) : 'غير محدد'}
                </div>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowProfileModal(false)}
              className="flex-1 btn btn-secondary"
            >
              إغلاق
            </button>
            <button
              onClick={() => {
                setShowProfileModal(false);
                setShowLogoutConfirm(true);
              }}
              className="flex-1 btn btn-error"
            >
              <span className="ml-2">🚪</span>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </Modal>

      {/* نافذة تأكيد تسجيل الخروج */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="تأكيد تسجيل الخروج"
        size="small"
      >
        <div className="text-center py-4">
          <div className="text-4xl mb-4">🚪</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            هل أنت متأكد من تسجيل الخروج؟
          </h3>
          <p className="text-gray-600 mb-6">
            سيتم إنهاء جلسة العمل الحالية وستحتاج لتسجيل الدخول مرة أخرى
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 btn btn-secondary"
            >
              إلغاء
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 btn btn-error"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// دالة مساعدة لعرض تسميات الصلاحيات
const getPermissionLabel = (permission) => {
  const permissionLabels = {
    'view_teachers': 'عرض المدرسين',
    'add_teacher': 'إضافة مدرس',
    'edit_teacher': 'تعديل المدرس',
    'delete_teacher': 'حذف المدرس',
    'view_operations': 'عرض العمليات',
    'add_operation': 'إضافة عملية',
    'edit_operation': 'تعديل العملية',
    'delete_operation': 'حذف العملية',
    'view_operation_prices': 'عرض أسعار العمليات',
    'view_payments': 'عرض المدفوعات',
    'add_payment': 'إضافة دفعة',
    'edit_payment': 'تعديل الدفعة',
    'delete_payment': 'حذف الدفعة',
    'view_expenses': 'عرض المصروفات',
    'add_expense': 'إضافة مصروف',
    'edit_expense': 'تعديل المصروف',
    'delete_expense': 'حذف المصروف',
    'view_reports': 'عرض التقارير',
    'view_financial_data': 'عرض البيانات المالية',
    'export_data': 'تصدير البيانات',
    'manage_users': 'إدارة المستخدمين',
    'view_system_settings': 'عرض إعدادات النظام'
  };

  return permissionLabels[permission] || permission;
};

export default UserProfile;