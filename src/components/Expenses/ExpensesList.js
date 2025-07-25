import React, { useState } from 'react';
import { formatCurrency, formatDate, timeAgo } from '../../utils/helpers';
import { EXPENSE_TYPES } from '../../utils/constants';

const ExpensesList = ({ 
  expenses, 
  onEdit, 
  onDelete 
}) => {
  const [viewMode, setViewMode] = useState('cards'); // cards, table

  // عرض البطاقات
  const renderCardsView = () => (
    <div className="grid-mobile">
      {expenses.map(expense => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );

  // عرض الجدول
  const renderTableView = () => (
    <div className="table-responsive">
      <table className="table-mobile">
        <thead>
          <tr>
            <th>النوع</th>
            <th>الوصف</th>
            <th>المبلغ</th>
            <th>التاريخ</th>
            <th>الملاحظات</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(expense => {
            const expenseType = EXPENSE_TYPES.find(type => type.value === expense.type);
            
            return (
              <tr key={expense.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${expenseType?.color?.replace('bg-', 'bg-') || 'bg-gray-200'}`}></div>
                    <span className="font-medium">{expenseType?.label || expense.type}</span>
                  </div>
                </td>
                
                <td>
                  <div className="max-w-xs">
                    <div className="font-medium text-gray-900 truncate">{expense.description}</div>
                    <div className="text-sm text-gray-500">{timeAgo(expense.expenseDate)}</div>
                  </div>
                </td>
                
                <td>
                  <div className="font-bold text-red-600">
                    {formatCurrency(expense.amount)}
                  </div>
                </td>
                
                <td>
                  <div className="text-center">
                    <div className="text-sm">{formatDate(expense.expenseDate)}</div>
                  </div>
                </td>
                
                <td>
                  <div className="max-w-xs">
                    {expense.notes ? (
                      <span className="text-sm text-gray-600 truncate block">
                        {expense.notes}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                
                <td>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(expense)}
                      className="btn btn-secondary btn-sm"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    
                    <button
                      onClick={() => onDelete(expense)}
                      className="btn btn-error btn-sm"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {/* شريط التحكم في العرض */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">عرض:</span>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'cards' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="عرض البطاقات"
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm border-r border-gray-300 ${
                viewMode === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="عرض الجدول"
            >
              ☰
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          عرض {expenses.length} مصروف
        </div>
      </div>

      {/* المحتوى حسب نوع العرض */}
      {viewMode === 'cards' && renderCardsView()}
      {viewMode === 'table' && renderTableView()}
    </div>
  );
};

// مكون بطاقة المصروف
const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  // الحصول على نوع المصروف
  const expenseType = EXPENSE_TYPES.find(type => type.value === expense.type);

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
    <div className="card-mobile border-l-4 border-red-400 hover:shadow-lg transition-all duration-200">
      
      {/* رأس البطاقة */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* أيقونة نوع المصروف */}
          <div className={`w-12 h-12 ${expenseType?.color || 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
            <span className="text-2xl">
              {expense.type === 'paper' ? '📄' :
               expense.type === 'ink' ? '🖋️' :
               expense.type === 'toner' ? '🖨️' :
               expense.type === 'maintenance' ? '🔧' :
               expense.type === 'electricity' ? '⚡' :
               expense.type === 'rent' ? '🏢' :
               expense.type === 'supplies' ? '📦' : '💸'}
            </span>
          </div>
          
          {/* معلومات أساسية */}
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {expenseType?.label || expense.type}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              📅 {formatDate(expense.expenseDate)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {timeAgo(expense.expenseDate)}
            </p>
          </div>
        </div>

        {/* المبلغ */}
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(expense.amount)}
          </div>
          <div className="text-xs text-gray-500">
            مصروف
          </div>
        </div>
      </div>

      {/* وصف المصروف */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {expense.description}
        </p>
      </div>

      {/* الملاحظات */}
      {expense.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">ملاحظات: </span>
            {expense.notes}
          </div>
        </div>
      )}

      {/* أزرار التحكم */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(expense)}
          className="flex-1 btn btn-secondary btn-sm"
        >
          <span className="ml-1">✏️</span>
          تعديل
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
              <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => handleMenuClick('edit')}
                  className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                >
                  <span>✏️</span>
                  تعديل
                </button>
                
                <div className="border-t border-gray-200"></div>
                
                <button
                  onClick={() => handleMenuClick('delete')}
                  className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-lg"
                >
                  <span>🗑️</span>
                  حذف
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* مؤشر المبلغ العالي */}
      {expense.amount > 500 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          مبلغ عالي
        </div>
      )}
    </div>
  );
};

export default ExpensesList;