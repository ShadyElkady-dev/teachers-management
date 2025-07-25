import React, { useState } from 'react';
import { formatCurrency, formatDate, timeAgo } from '../../utils/helpers';

const TeacherCard = ({ 
  teacher, 
  onEdit, 
  onDelete, 
  onAddOperation, 
  onViewDetails 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // تحديد لون الحالة
  const getStatusColor = () => {
    if (teacher.debt > 0) return 'border-red-200 bg-red-50';
    if (teacher.debt === 0) return 'border-green-200 bg-green-50';
    return 'border-blue-200 bg-blue-50';
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
    <div className={`card-mobile border-2 ${getStatusColor()} hover:shadow-lg transition-all duration-200`}>
      
      {/* رأس البطاقة */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* أفاتار المدرس */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">
              {teacher.name.charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* معلومات أساسية */}
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {teacher.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              📞 {teacher.phone}
            </p>
            {teacher.school && (
              <p className="text-xs text-gray-500 mt-1">
                🏫 {teacher.school}
              </p>
            )}
          </div>
        </div>

        {/* حالة المديونية */}
        <div className="text-center">
          <div className="text-2xl mb-1">{getStatusIcon()}</div>
          <div className={`text-lg font-bold ${
            teacher.debt > 0 ? 'text-red-600' :
            teacher.debt === 0 ? 'text-green-600' : 'text-blue-600'
          }`}>
            {formatCurrency(Math.abs(teacher.debt))}
          </div>
          <div className="text-xs text-gray-500">
            {teacher.debt > 0 ? 'مديونية' :
             teacher.debt === 0 ? 'مسدد' : 'دفع زائد'}
          </div>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
          <div className="text-xl font-bold text-blue-600">{teacher.operationsCount}</div>
          <div className="text-xs text-gray-500">عمليات</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatCurrency(teacher.totalOperations)}
          </div>
        </div>
        
        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
          <div className="text-xl font-bold text-green-600">{teacher.paymentsCount}</div>
          <div className="text-xs text-gray-500">دفعات</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatCurrency(teacher.totalPayments)}
          </div>
        </div>
      </div>

      {/* آخر نشاط */}
      <div className="space-y-2 mb-4">
        {teacher.lastOperation && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">آخر عملية:</span>
            <span className="text-gray-700">
              {timeAgo(teacher.lastOperation.operationDate)}
            </span>
          </div>
        )}
        
        {teacher.lastPayment && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">آخر دفعة:</span>
            <span className="text-gray-700">
              {timeAgo(teacher.lastPayment.paymentDate)}
            </span>
          </div>
        )}
        
        {teacher.email && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">📧</span>
            <span className="text-gray-700 truncate ml-2">{teacher.email}</span>
          </div>
        )}
      </div>

      {/* أزرار التحكم */}
      <div className="flex items-center gap-2">
        {/* زر إضافة عملية */}
        <button
          onClick={() => onAddOperation(teacher)}
          className="flex-1 btn btn-primary btn-sm"
        >
          <span className="ml-1">➕</span>
          إضافة عملية
        </button>

        {/* زر عرض التفاصيل */}
        <button
          onClick={() => onViewDetails(teacher)}
          className="btn btn-secondary btn-sm px-3"
          title="عرض التفاصيل"
        >
          👁️
        </button>

        {/* قائمة الخيارات */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="btn btn-secondary btn-sm px-3"
            title="المزيد"
          >
            ⋮
          </button>

          {showMenu && (
            <>
              {/* خلفية لإغلاق القائمة */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              
              {/* القائمة المنسدلة */}
              <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => handleMenuClick('edit')}
                  className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                >
                  <span>✏️</span>
                  تعديل البيانات
                </button>
                
                <button
                  onClick={() => handleMenuClick('viewDetails')}
                  className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <span>📊</span>
                  التفاصيل الكاملة
                </button>
                
                <button
                  onClick={() => handleMenuClick('addOperation')}
                  className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <span>➕</span>
                  عملية جديدة
                </button>
                
                <div className="border-t border-gray-200"></div>
                
                <button
                  onClick={() => handleMenuClick('delete')}
                  className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-lg"
                >
                  <span>🗑️</span>
                  حذف المدرس
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* مؤشر الحالة */}
      <div className="absolute top-2 left-2">
        {teacher.debt > 0 && (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" title="يوجد مديونية"></div>
        )}
        {teacher.debt === 0 && (
          <div className="w-3 h-3 bg-green-500 rounded-full" title="حساب مسدد"></div>
        )}
        {teacher.debt < 0 && (
          <div className="w-3 h-3 bg-blue-500 rounded-full" title="دفع زائد"></div>
        )}
      </div>

      {/* شارة الأولوية للديون العالية */}
      {teacher.debt > 1000 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          مديونية عالية
        </div>
      )}
    </div>
  );
};

export default TeacherCard;