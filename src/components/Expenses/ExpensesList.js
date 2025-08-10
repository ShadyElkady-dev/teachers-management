import React, { useState, useEffect } from 'react';
import { formatCurrency, isSmallScreen, formatTime12Hour, formatDateWithDay, getTimeAgo } from '../../utils/helpers';
import { EXPENSE_TYPES } from '../../utils/constants';

const ExpensesList = ({ 
  expenses, 
  onEdit, 
  onDelete 
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
      <div className="text-6xl mb-4">💸</div>
      <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد مصروفات</div>
      <div className="text-gray-500 text-lg">لم يتم العثور على أي مصروفات مطابقة</div>
    </div>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {expenses.map(expense => (
        <ExpenseCardEnhanced
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
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
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">التاريخ والوقت</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">النوع</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الوصف</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">المبلغ</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الملاحظات</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map(expense => (
              <ExpenseTableRow
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {expenses.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 font-medium">
              عرض {expenses.length} مصروف
            </div>
            <div className="flex items-center gap-6 text-gray-700">
              <div className="bg-red-100 px-3 py-1 rounded-full">
                <span className="font-medium text-red-800">إجمالي المصروفات: </span>
                <span className="font-bold text-red-900">
                  {formatCurrency(expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0))}
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
            عرض {expenses.length} مصروف
          </div>
        </div>
      )}

      {expenses.length === 0 ? renderEmptyState() : (
        viewMode === 'cards' ? renderCardsView() : renderTableView()
      )}
    </div>
  );
};

// مكون بطاقة المصروف المحسن
const ExpenseCardEnhanced = ({ expense, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  // الحصول على نوع المصروف
  const expenseType = EXPENSE_TYPES.find(type => type.value === expense.type);

  const getExpenseIcon = () => {
    switch (expense.type) {
      case 'paper': return '📄';
      case 'ink': return '🖋️';
      case 'toner': return '🖨️';
      case 'maintenance': return '🔧';
      case 'electricity': return '⚡';
      case 'rent': return '🏢';
      case 'supplies': return '📦';
      default: return '💸';
    }
  };

  const getCardColor = () => {
    switch (expense.type) {
      case 'paper': return 'from-blue-500 to-blue-600';
      case 'ink': return 'from-purple-500 to-purple-600';
      case 'toner': return 'from-gray-500 to-gray-600';
      case 'maintenance': return 'from-red-500 to-red-600';
      case 'electricity': return 'from-yellow-500 to-yellow-600';
      case 'rent': return 'from-green-500 to-green-600';
      case 'supplies': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const handleMenuClick = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'edit':
        onEdit(expense);
        break;
      case 'delete':
        onDelete(expense);
        break;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 flex flex-col">
      
      {/* رأس البطاقة مع الخلفية المتدرجة */}
      <div className={`bg-gradient-to-r ${getCardColor()} p-6 text-white relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl">
                {getExpenseIcon()}
              </span>
            </div>
            
            <div>
              <h3 className="font-bold text-xl leading-tight mb-1">
                {expenseType?.label || expense.type}
              </h3>
              <div className="space-y-1">
                <p className="text-xs opacity-80">📅 {formatDateWithDay(expense.expenseDate)}</p>
                <p className="text-xs opacity-80">⏰ {formatTime12Hour(expense.expenseDate)}</p>
                <p className="text-xs opacity-70 bg-white bg-opacity-20 rounded-full px-2 py-1 inline-block">
                  🕐 {getTimeAgo(expense.expenseDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatCurrency(expense.amount)}
            </div>
            <div className="text-xs opacity-90">
              مصروف
            </div>
          </div>
        </div>
      </div>

      {/* محتوى البطاقة */}
      <div className="p-6 flex flex-col flex-grow">
        
        {/* وصف المصروف */}
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-gray-800 leading-relaxed font-medium break-all" style={{wordBreak: 'break-all'}}>
              {expense.description}
            </p>
          </div>
        </div>

        {/* الملاحظات إن وجدت */}
        {expense.notes && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📝</span>
              <span className="font-medium text-yellow-900">ملاحظات</span>
            </div>
            <p className="text-yellow-800 text-sm leading-relaxed break-all" style={{wordBreak: 'break-all'}}>
              {expense.notes.length > 100 
                ? `${expense.notes.substring(0, 100)}...` 
                : expense.notes
              }
            </p>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-3 mt-auto pt-6 border-t">
          <button
            onClick={() => onEdit(expense)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <span className="text-lg ml-1">✏️</span>
            تعديل
          </button>

          {/* قائمة الخيارات */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-200"
              title="المزيد"
            >
              <span className="text-lg">⋮</span>
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-20">
                  <button
                    onClick={() => handleMenuClick('edit')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 font-medium text-blue-700 rounded-t-2xl transition-colors"
                  >
                    <span className="text-lg">✏️</span>
                    تعديل المصروف
                  </button>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={() => handleMenuClick('delete')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 font-medium rounded-b-2xl transition-colors"
                  >
                    <span className="text-lg">🗑️</span>
                    حذف المصروف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* مؤشر المبلغ العالي */}
      {expense.amount > 500 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
          مبلغ عالي
        </div>
      )}
    </div>
  );
};

// مكون صف جدول المصروف المحسن
const ExpenseTableRow = ({ expense, onEdit, onDelete }) => {
  const expenseType = EXPENSE_TYPES.find(t => t.value === expense.type);

  const getExpenseIcon = () => {
    switch (expense.type) {
      case 'paper': return '📄';
      case 'ink': return '🖋️';
      case 'toner': return '🖨️';
      case 'maintenance': return '🔧';
      case 'electricity': return '⚡';
      case 'rent': return '🏢';
      case 'supplies': return '📦';
      default: return '💸';
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <span>📅</span>
            <span>{formatDateWithDay(expense.expenseDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>⏰</span>
            <span>{formatTime12Hour(expense.expenseDate)}</span>
          </div>
          <div className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            🕐 {getTimeAgo(expense.expenseDate)}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-lg ml-2">{getExpenseIcon()}</span>
          <div>
            <span className="text-sm font-medium text-gray-900">{expenseType?.label || expense.type}</span>
            <div className={`inline-block w-3 h-3 rounded-full ml-2 ${getTypeColorClass(expense.type)}`}></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 max-w-xs whitespace-normal break-all">{expense.description}</td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="bg-red-100 rounded-full px-3 py-1 inline-block">
          <span className="text-sm font-bold text-red-800">{formatCurrency(expense.amount || 0)}</span>
        </div>
      </td>
      <td className="px-6 py-4 max-w-xs whitespace-normal break-all">
        {expense.notes ? (
          <span className="text-sm text-gray-600" title={expense.notes}>{expense.notes}</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(expense)}
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="تعديل"
          >
            ✏️ تعديل
          </button>
          <button
            onClick={() => onDelete(expense)}
            className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="حذف"
          >
            🗑️ حذف
          </button>
        </div>
      </td>
    </tr>
  );
};

// دالة مساعدة للحصول على كلاس لون النوع
const getTypeColorClass = (type) => {
  const colors = {
    paper: 'bg-blue-500',
    ink: 'bg-purple-500',
    toner: 'bg-gray-500',
    maintenance: 'bg-red-500',
    electricity: 'bg-yellow-500',
    rent: 'bg-green-500',
    supplies: 'bg-indigo-500',
    other: 'bg-gray-400'
  };
  return colors[type] || 'bg-gray-400';
};

export default ExpensesList;