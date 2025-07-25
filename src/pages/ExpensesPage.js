import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// Components
import ExpensesList from '../components/Expenses/ExpensesList';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';

// Utils
import { searchInText, formatCurrency, formatDate, groupBy } from '../utils/helpers';
import { MESSAGES, EXPENSE_TYPES } from '../utils/constants';

const ExpensesPage = () => {
  const { state, expenseActions, calculateTotalProfit } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // حالات المكونات
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, year
  const [sortBy, setSortBy] = useState('date'); // date, amount, type
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // معالجة معاملات الـ URL
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      setShowExpenseForm(true);
      setEditingExpense(null);
    }
  }, [searchParams]);

  // تصفية المصروفات
  const getFilteredExpenses = () => {
    return state.expenses.filter(expense => {
      // فلتر البحث
      const matchesSearch = !searchTerm.trim() || 
        searchInText(expense.description, searchTerm) ||
        searchInText(expense.type, searchTerm) ||
        searchInText(expense.notes, searchTerm);

      // فلتر النوع
      const matchesType = filterType === 'all' || expense.type === filterType;

      // فلتر التاريخ
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const expenseDate = expense.expenseDate?.toDate ? expense.expenseDate.toDate() : new Date(expense.expenseDate);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = expenseDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = expenseDate >= weekAgo;
            break;
          case 'month':
            matchesDate = expenseDate.getMonth() === now.getMonth() && 
                         expenseDate.getFullYear() === now.getFullYear();
            break;
          case 'year':
            matchesDate = expenseDate.getFullYear() === now.getFullYear();
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  };

  const filteredExpenses = getFilteredExpenses()
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const aDate = a.expenseDate?.toDate ? a.expenseDate.toDate() : new Date(a.expenseDate);
          const bDate = b.expenseDate?.toDate ? b.expenseDate.toDate() : new Date(b.expenseDate);
          comparison = aDate - bDate;
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type, 'ar');
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // حساب الإحصائيات
  const statistics = {
    totalExpenses: state.expenses.length,
    filteredExpenses: filteredExpenses.length,
    totalAmount: filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    averageExpense: filteredExpenses.length > 0 
      ? filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0) / filteredExpenses.length 
      : 0,
    monthlyExpenses: state.expenses.filter(expense => {
      const expenseDate = expense.expenseDate?.toDate ? expense.expenseDate.toDate() : new Date(expense.expenseDate);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    }).reduce((sum, expense) => sum + (expense.amount || 0), 0),
    byType: groupBy(filteredExpenses, 'type')
  };

  // إحصائيات حسب النوع
  const expensesByType = EXPENSE_TYPES.map(type => {
    const typeExpenses = filteredExpenses.filter(expense => expense.type === type.value);
    const total = typeExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    return {
      ...type,
      count: typeExpenses.length,
      total,
      percentage: statistics.totalAmount > 0 ? (total / statistics.totalAmount) * 100 : 0
    };
  }).filter(type => type.count > 0);

  // وظائف التحكم في المصروفات
  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowExpenseForm(true);
    setSearchParams({});
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (expense) => {
    if (window.confirm(MESSAGES.CONFIRM.DELETE_EXPENSE)) {
      try {
        await expenseActions.deleteExpense(expense.id);
        toast.success(MESSAGES.SUCCESS.EXPENSE_DELETED);
      } catch (error) {
        toast.error(error.message || MESSAGES.ERROR.GENERAL);
      }
    }
  };

  const handleSaveExpense = async (expenseData) => {
    try {
      if (editingExpense) {
        await expenseActions.updateExpense(editingExpense.id, expenseData);
        toast.success(MESSAGES.SUCCESS.EXPENSE_UPDATED);
      } else {
        await expenseActions.addExpense(expenseData);
        toast.success(MESSAGES.SUCCESS.EXPENSE_ADDED);
      }
      
      setShowExpenseForm(false);
      setEditingExpense(null);
    } catch (error) {
      toast.error(error.message || MESSAGES.ERROR.GENERAL);
    }
  };

  // إغلاق النوافذ
  const handleCloseModals = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  if (state.loading.expenses) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="section-mobile">
      
      {/* رأس الصفحة */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المصروفات الخاصة</h1>
            <p className="text-gray-600 mt-1">
              تتبع وإدارة مصروفات المكتب
            </p>
          </div>
          
          <button
            onClick={handleAddExpense}
            className="btn-mobile btn-primary"
          >
            <span className="text-lg">➕</span>
            إضافة مصروف جديد
          </button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-600 font-medium">إجمالي المصروفات</div>
              <div className="text-lg font-bold text-red-900">{formatCurrency(statistics.totalAmount)}</div>
            </div>
            <div className="text-2xl">💸</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium">عدد المصروفات</div>
              <div className="text-2xl font-bold text-blue-900">{statistics.filteredExpenses}</div>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-yellow-600 font-medium">مصروفات الشهر</div>
              <div className="text-lg font-bold text-yellow-900">{formatCurrency(statistics.monthlyExpenses)}</div>
            </div>
            <div className="text-2xl">📅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-600 font-medium">صافي الأرباح</div>
              <div className="text-lg font-bold text-green-900">{formatCurrency(calculateTotalProfit())}</div>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
      </div>

      {/* إحصائيات حسب النوع */}
      {expensesByType.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">المصروفات حسب النوع</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expensesByType.map((type) => (
              <div key={type.value} className={`${type.color} border rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.count} مصروف</div>
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatCurrency(type.total)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(type.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {type.percentage.toFixed(1)}% من الإجمالي
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* أدوات التصفية والبحث */}
      <div className="mb-6 space-y-4">
        
        {/* شريط البحث */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="البحث في المصروفات (الوصف، النوع، الملاحظات...)"
        />

        {/* الفلاتر */}
        <div className="flex flex-wrap gap-4 items-center">
          
          {/* فلتر النوع */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">النوع:</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input text-sm py-2"
            >
              <option value="all">الكل</option>
              {EXPENSE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر التاريخ */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">الفترة:</label>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input text-sm py-2"
            >
              <option value="all">الكل</option>
              <option value="today">اليوم</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذا العام</option>
            </select>
          </div>

          {/* الترتيب */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">ترتيب حسب:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input text-sm py-2"
            >
              <option value="date">التاريخ</option>
              <option value="amount">المبلغ</option>
              <option value="type">النوع</option>
            </select>
          </div>

          {/* اتجاه الترتيب */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary btn-sm"
          >
            {sortOrder === 'asc' ? '📈' : '📉'}
            {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
          </button>

          {/* زر مسح الفلاتر */}
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setDateFilter('all');
              setSortBy('date');
              setSortOrder('desc');
            }}
            className="btn btn-secondary btn-sm"
          >
            مسح الفلاتر
          </button>
        </div>
      </div>

      {/* قائمة المصروفات */}
      <div className="mb-6">
        {filteredExpenses.length === 0 && searchTerm ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">لا توجد نتائج</div>
            <div className="empty-description">
              لم يتم العثور على مصروفات مطابقة لكلمة البحث "{searchTerm}"
            </div>
          </div>
        ) : filteredExpenses.length === 0 && (filterType !== 'all' || dateFilter !== 'all') ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-title">لا توجد مصروفات</div>
            <div className="empty-description">
              لا توجد مصروفات مطابقة للفلاتر المحددة
            </div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <div className="empty-title">لا توجد مصروفات</div>
            <div className="empty-description">
              ابدأ بإضافة مصروف جديد لتتبع نفقات المكتب
            </div>
            <button
              onClick={handleAddExpense}
              className="btn btn-primary mt-4"
            >
              إضافة مصروف جديد
            </button>
          </div>
        ) : (
          <ExpensesList
            expenses={filteredExpenses}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
          />
        )}
      </div>

      {/* نافذة إضافة/تعديل مصروف */}
      <Modal
        isOpen={showExpenseForm}
        onClose={handleCloseModals}
        title={editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
        size="medium"
      >
        <ExpenseForm
          expense={editingExpense}
          onSave={handleSaveExpense}
          onCancel={handleCloseModals}
          loading={state.loading.expenses}
        />
      </Modal>
    </div>
  );
};

export default ExpensesPage;