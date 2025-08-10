import React, { useState, useEffect } from 'react';
import { formatCurrency, isSmallScreen, formatTime12Hour, formatDateWithDay, getTimeAgo } from '../../utils/helpers';

const AccountsList = ({
  teachers,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onViewDetails
}) => {
  const [isMobile, setIsMobile] = useState(isSmallScreen());
  const [viewMode, setViewMode] = useState(isMobile ? 'cards' : 'table');

  useEffect(() => {
    const handleResize = () => {
      const mobile = isSmallScreen();
      setIsMobile(mobile);
      setViewMode(mobile ? 'cards' : 'table');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderEmptyState = () => (
    <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
      <div className="text-6xl mb-4">💰</div>
      <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد حسابات</div>
      <div className="text-gray-500 text-lg">لم يتم العثور على أي حسابات مطابقة</div>
    </div>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {teachers.map(teacher => (
        <TeacherAccountCard
          key={teacher.id}
          teacher={teacher}
          onAddPayment={onAddPayment}
          onEditPayment={onEditPayment}
          onDeletePayment={onDeletePayment}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المدرس</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">إجمالي العمليات</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">إجمالي المدفوعات</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">المديونية</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">آخر دفعة</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الحالة</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teachers.map(teacher => (
              <TeacherAccountTableRow
                key={teacher.id}
                teacher={teacher}
                onAddPayment={onAddPayment}
                onEditPayment={onEditPayment}
                onDeletePayment={onDeletePayment}
                onViewDetails={onViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      {teachers.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 font-medium">
              عرض {teachers.length} حساب
            </div>
            <div className="flex items-center gap-6 text-gray-700">
              <div className="bg-red-100 px-3 py-1 rounded-full">
                <span className="font-medium text-red-800">إجمالي الديون: </span>
                <span className="font-bold text-red-900">
                  {formatCurrency(teachers.reduce((sum, t) => sum + Math.max(0, t.debt), 0))}
                </span>
              </div>
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="font-medium text-green-800">إجمالي المدفوعات: </span>
                <span className="font-bold text-green-900">
                  {formatCurrency(teachers.reduce((sum, t) => sum + t.totalPayments, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {!isMobile && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">عرض:</span>
            <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="عرض البطاقات"
              >
                ⊞ بطاقات
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium border-r-2 border-gray-300 transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="عرض الجدول"
              >
                ☰ جدول
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 font-medium">
            عرض {teachers.length} حساب
          </div>
        </div>
      )}

      {teachers.length === 0 ? renderEmptyState() : (
        viewMode === 'cards' ? renderCardsView() : renderTableView()
      )}
    </div>
  );
};

// مكون بطاقة حساب المدرس المحسن
const TeacherAccountCard = ({ 
  teacher, 
  onAddPayment, 
  onEditPayment, 
  onDeletePayment, 
  onViewDetails 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = () => {
    if (teacher.debt > 0) return 'from-red-500 to-red-600';
    if (teacher.debt === 0) return 'from-green-500 to-green-600';
    return 'from-blue-500 to-blue-600';
  };

  const getStatusIcon = () => {
    if (teacher.debt > 0) return '⚠️';
    if (teacher.debt === 0) return '✅';
    return '💰';
  };

  const getStatusText = () => {
    if (teacher.debt > 0) return 'مديون';
    if (teacher.debt === 0) return 'مسدد';
    return 'دفع زائد';
  };

  const handleMenuClick = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'addPayment':
        onAddPayment(teacher);
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
            <div className="text-sm font-bold">
              {formatCurrency(Math.abs(teacher.debt))}
            </div>
            <div className="text-xs opacity-90">
              {getStatusText()}
            </div>
          </div>
        </div>
      </div>

      {/* محتوى البطاقة */}
      <div className="p-6">
        
        {/* الإحصائيات */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-xl font-bold text-blue-700">{teacher.operationsCount}</div>
            <div className="text-xs text-blue-600 font-medium">عمليات</div>
            <div className="text-xs text-blue-500 mt-1">
              {formatCurrency(teacher.totalOperations)}
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="text-xl font-bold text-green-700">{teacher.paymentsCount}</div>
            <div className="text-xs text-green-600 font-medium">دفعات</div>
            <div className="text-xs text-green-500 mt-1">
              {formatCurrency(teacher.totalPayments)}
            </div>
          </div>

          <div className={`text-center p-4 rounded-xl border ${
            teacher.debt > 0 ? 'bg-red-50 border-red-200' :
            teacher.debt === 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className={`text-xl font-bold ${
              teacher.debt > 0 ? 'text-red-700' :
              teacher.debt === 0 ? 'text-green-700' : 'text-blue-700'
            }`}>
              {Math.abs(teacher.debt) > 999 ? '🔥' : getStatusIcon()}
            </div>
            <div className="text-xs font-medium text-gray-600">الحالة</div>
          </div>
        </div>

        {/* آخر دفعة مع نظام 12 ساعة */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💳</span>
              <span className="font-medium text-gray-700">آخر دفعة</span>
            </div>
            {teacher.lastPayment ? (
              <div className="text-right">
                <div className="text-sm font-bold text-green-700">
                  {formatCurrency(teacher.lastPayment.amount)}
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">
                    📅 {formatDateWithDay(teacher.lastPayment.paymentDate)}
                  </div>
                  <div className="text-xs text-gray-600">
                    ⏰ {formatTime12Hour(teacher.lastPayment.paymentDate)}
                  </div>
                  <div className="text-xs text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">
                    🕐 {getTimeAgo(teacher.lastPayment.paymentDate)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">لا توجد دفعات</div>
            )}
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-3">
          <button
            onClick={() => onAddPayment(teacher)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <span className="text-lg ml-1">💳</span>
            إضافة دفعة
          </button>

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
                
                <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-20">
                  <button
                    onClick={() => handleMenuClick('viewDetails')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 font-medium text-blue-700 rounded-t-2xl transition-colors"
                  >
                    <span className="text-lg">📊</span>
                    كشف حساب كامل
                  </button>
                  
                  <div className="border-t border-gray-200"></div>
                  
                  <button
                    onClick={() => handleMenuClick('addPayment')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-green-50 text-green-700 flex items-center gap-3 font-medium rounded-b-2xl transition-colors"
                  >
                    <span className="text-lg">💳</span>
                    تسجيل دفعة جديدة
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* مؤشرات حالة */}
      {teacher.debt > 1000 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
          مديونية عالية
        </div>
      )}
      
      {teacher.paymentsCount === 0 && teacher.operationsCount > 0 && (
        <div className="absolute top-10 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          لم يدفع أبداً
        </div>
      )}
    </div>
  );
};

// ========== بداية التعديل الرئيسي ==========
const TeacherAccountTableRow = ({ 
  teacher, 
  onAddPayment, 
  onEditPayment, 
  onDeletePayment, 
  onViewDetails 
}) => {
  const [showActions, setShowActions] = useState(false);

  const toggleActions = () => {
    setShowActions(!showActions);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* المدرس */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ml-3 shadow-md">
            <span className="text-white font-bold text-lg">
              {teacher.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{teacher.name}</div>
            <div className="text-sm text-gray-600">📞 {teacher.phone}</div>
            {teacher.school && (
              <div className="text-xs text-gray-500">🏫 {teacher.school}</div>
            )}
          </div>
        </div>
      </td>
      
      {/* إجمالي العمليات */}
      <td className="px-6 py-4 text-center">
        <div className="bg-blue-100 rounded-full px-3 py-2 inline-block">
          <div className="text-lg font-bold text-blue-700">
            {formatCurrency(teacher.totalOperations)}
          </div>
          <div className="text-xs text-blue-600">{teacher.operationsCount} عملية</div>
        </div>
      </td>
      
      {/* إجمالي المدفوعات */}
      <td className="px-6 py-4 text-center">
        <div className="bg-green-100 rounded-full px-3 py-2 inline-block">
          <div className="text-lg font-bold text-green-700">
            {formatCurrency(teacher.totalPayments)}
          </div>
          <div className="text-xs text-green-600">{teacher.paymentsCount} دفعة</div>
        </div>
      </td>
      
      {/* المديونية */}
      <td className="px-6 py-4 text-center">
        <div className={`rounded-full px-3 py-2 inline-block ${
          teacher.debt > 0 ? 'bg-red-100' :
          teacher.debt === 0 ? 'bg-green-100' : 'bg-blue-100'
        }`}>
          <div className={`text-xl font-bold ${
            teacher.debt > 0 ? 'text-red-700' :
            teacher.debt === 0 ? 'text-green-700' : 'text-blue-700'
          }`}>
            {formatCurrency(Math.abs(teacher.debt))}
          </div>
          <div className={`text-xs ${
            teacher.debt > 0 ? 'text-red-600' :
            teacher.debt === 0 ? 'text-green-600' : 'text-blue-600'
          }`}>
            {teacher.debt > 0 ? 'دين' :
             teacher.debt === 0 ? 'مسدد' : 'زائد'}
          </div>
        </div>
      </td>
      
      {/* آخر دفعة */}
      <td className="px-6 py-4 text-center">
        {teacher.lastPayment ? (
          <div className="bg-purple-100 rounded-lg px-3 py-2 inline-block">
            <div className="text-sm font-bold text-purple-700">
              {formatCurrency(teacher.lastPayment.amount)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-purple-600">
                📅 {formatDateWithDay(teacher.lastPayment.paymentDate)}
              </div>
              <div className="text-xs text-purple-600">
                ⏰ {formatTime12Hour(teacher.lastPayment.paymentDate)}
              </div>
              <div className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded-full">
                🕐 {getTimeAgo(teacher.lastPayment.paymentDate)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400 bg-gray-100 rounded-lg px-3 py-2">
            لا توجد دفعات
          </div>
        )}
      </td>
      
      {/* الحالة */}
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold ${
          teacher.debt > 0 
            ? 'bg-red-100 text-red-800' 
            : teacher.debt === 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
        }`}>
          <span className="ml-1 text-lg">
            {teacher.debt > 0 ? '⚠️' : teacher.debt === 0 ? '✅' : '💰'}
          </span>
          {teacher.debt > 0 ? 'مديون' :
           teacher.debt === 0 ? 'مسدد' : 'دفع زائد'}
        </span>
        
        <div className="flex justify-center gap-1 mt-2">
          {teacher.debt > 1000 && (
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse" title="دين عالي"></span>
          )}
          {teacher.paymentsCount === 0 && teacher.operationsCount > 0 && (
            <span className="inline-block w-3 h-3 bg-orange-500 rounded-full" title="لم يدفع أبداً"></span>
          )}
        </div>
      </td>
      
      {/* الإجراءات */}
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center flex-wrap gap-2">
          <button
            onClick={() => onAddPayment(teacher)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="إضافة دفعة"
          >
            💳 دفعة
          </button>
          
          <button
            onClick={() => onViewDetails(teacher)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="عرض التفاصيل"
          >
            👁️ تفاصيل
          </button>
          
          <div className="relative">
            <button
              onClick={toggleActions}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="المزيد"
            >
              <span className="text-lg">⋮</span>
            </button>

            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={toggleActions}
                />
                
                <div className="absolute left-0 bottom-full mb-2 w-40 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20">
                  <button
                    onClick={() => {
                      onViewDetails(teacher);
                      toggleActions();
                    }}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-xl font-medium"
                  >
                    <span>📊</span>
                    كشف حساب كامل
                  </button>
                  
                  <div className="border-t border-gray-200"></div>
                  
                  <button
                    onClick={() => {
                      onAddPayment(teacher);
                      toggleActions();
                    }}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-green-50 text-green-700 flex items-center gap-2 rounded-b-xl font-medium"
                  >
                    <span>💳</span>
                    تسجيل دفعة جديدة
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};
// ========== نهاية التعديل الرئيسي ==========

export default AccountsList;