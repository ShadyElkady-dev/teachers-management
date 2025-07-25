import React, { useState } from 'react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { formatCurrency, formatDate, timeAgo } from '../../utils/helpers';

const TeacherCard = ({ 
  teacher, 
  onEdit, 
  onDelete, 
  onAddOperation, 
  onViewDetails 
}) => {
  const { hasPermission } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  // تحديد لون الحالة
  const getStatusColor = () => {
    if (teacher.debt > 0) return 'from-red-500 to-red-600';
    if (teacher.debt === 0) return 'from-green-500 to-green-600';
    return 'from-blue-500 to-blue-600';
  };

  // تحديد أيقونة الحالة
  const getStatusIcon = () => {
    if (teacher.debt > 0) return '⚠️';
    if (teacher.debt === 0) return '✅';
    return '💰';
  };

  const handleMenuClick = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'edit':
        onEdit(teacher);
        break;
      case 'delete':
        onDelete(teacher);
        break;
      case 'addOperation':
        onAddOperation(teacher);
        break;
      case 'viewDetails':
        onViewDetails(teacher);
        break;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100">
      
      {/* رأس البطاقة مع الخلفية المتدرجة */}
      <div className={`bg-gradient-to-r ${getStatusColor()} p-6 text-white relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {teacher.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div>
              <h3 className="font-bold text-xl leading-tight mb-1">
                {teacher.name}
              </h3>
              <p className="text-sm opacity-90 mb-1">
                📞 {teacher.phone}
              </p>
              {teacher.school && (
                <p className="text-xs opacity-80">
                  🏫 {teacher.school}
                </p>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-1">{getStatusIcon()}</div>
            <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
              <div className="text-sm font-bold">
                {formatCurrency(Math.abs(teacher.debt))}
              </div>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* محتوى البطاقة */}
      <div className="p-6">
        
        {/* الإحصائيات */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{teacher.operationsCount}</div>
            <div className="text-sm text-blue-600 font-medium">عمليات</div>
            <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
              <div className="text-xs text-blue-500 mt-1">
                {formatCurrency(teacher.totalOperations)}
              </div>
            </PermissionGate>
          </div>
          
          <PermissionGate 
            permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
            fallback={
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-400">---</div>
                <div className="text-sm text-gray-400 font-medium">دفعات</div>
                <div className="text-xs text-gray-400 mt-1">مخفي</div>
              </div>
            }
          >
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-700">{teacher.paymentsCount}</div>
              <div className="text-sm text-green-600 font-medium">دفعات</div>
              <div className="text-xs text-green-500 mt-1">
                {formatCurrency(teacher.totalPayments)}
              </div>
            </div>
          </PermissionGate>
        </div>

        {/* معلومات إضافية */}
        {(teacher.email || teacher.address) && (
          <div className="mb-6 space-y-2">
            {teacher.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📧</span>
                <span className="truncate">{teacher.email}</span>
              </div>
            )}
            {teacher.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📍</span>
                <span className="truncate">{teacher.address}</span>
              </div>
            )}
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-3">
          <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
            <button
              onClick={() => onAddOperation(teacher)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="text-lg ml-1">➕</span>
              إضافة عملية
            </button>
          </PermissionGate>

          <button
            onClick={() => onViewDetails(teacher)}
            className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-xl transition-all duration-200"
            title="عرض التفاصيل"
          >
            👁️
          </button>

          {/* قائمة الخيارات */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-200"
              title="المزيد"
            >
              ⋮
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                
                <div className="absolute left-0 mt-2 w-48 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-20">
                  <PermissionGate permission={PERMISSIONS.EDIT_TEACHER}>
                    <button
                      onClick={() => handleMenuClick('edit')}
                      className="w-full text-right px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 font-medium text-blue-700 rounded-t-xl transition-colors"
                    >
                      <span className="text-lg">✏️</span>
                      تعديل البيانات
                    </button>
                  </PermissionGate>
                  
                  <button
                    onClick={() => handleMenuClick('viewDetails')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 font-medium text-gray-700 border-t border-gray-200 transition-colors"
                  >
                    <span className="text-lg">📊</span>
                    التفاصيل الكاملة
                  </button>
                  
                  <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
                    <button
                      onClick={() => handleMenuClick('addOperation')}
                      className="w-full text-right px-4 py-3 text-sm hover:bg-green-50 flex items-center gap-3 font-medium text-green-700 border-t border-gray-200 transition-colors"
                    >
                      <span className="text-lg">➕</span>
                      عملية جديدة
                    </button>
                  </PermissionGate>
                  
                  <PermissionGate permission={PERMISSIONS.DELETE_TEACHER}>
                    <div className="border-t border-gray-200"></div>
                    
                    <button
                      onClick={() => handleMenuClick('delete')}
                      className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 font-medium rounded-b-xl transition-colors"
                    >
                      <span className="text-lg">🗑️</span>
                      حذف المدرس
                    </button>
                  </PermissionGate>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* مؤشرات حالة */}
      <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
        {teacher.debt > 1000 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
            مديونية عالية
          </div>
        )}
      </PermissionGate>
    </div>
  );
};

export default TeacherCard;