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
import { searchInText, formatCurrency, formatDate, groupBy, isSmallScreen } from '../utils/helpers';
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
  const [isMobile, setIsMobile] = useState(isSmallScreen());

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isSmallScreen());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* رأس الصفحة */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">💸 إدارة المصروفات</h1>
            <p className="text-gray-600 text-lg mb-6">
              تتبع وإدارة مصروفات المكتب والأعمال
            </p>
            
            <button
              onClick={handleAddExpense}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
            >
              <span className="text-2xl ml-2">➕</span>
              إضافة مصروف جديد
            </button>
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">إجمالي المصروفات</div>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalAmount)}</div>
                <div className="text-xs opacity-80">من {statistics.filteredExpenses} مصروف</div>
              </div>
              <div className="text-4xl opacity-80">💸</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">عدد المصروفات</div>
                <div className="text-3xl font-bold">{statistics.filteredExpenses}</div>
                <div className="text-xs opacity-80">من أصل {statistics.totalExpenses}</div>
              </div>
              <div className="text-4xl opacity-80">📊</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">مصروفات الشهر</div>
                <div className="text-xl font-bold">{formatCurrency(statistics.monthlyExpenses)}</div>
                <div className="text-xs opacity-80">الشهر الحالي</div>
              </div>
              <div className="text-4xl opacity-80">📅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">صافي الأرباح</div>
                <div className="text-xl font-bold">{formatCurrency(calculateTotalProfit())}</div>
                <div className="text-xs opacity-80">بعد المصروفات</div>
              </div>
              <div className="text-4xl opacity-80">💰</div>
            </div>
          </div>
        </div>

        {/* إحصائيات حسب النوع */}
        {expensesByType.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📈 المصروفات حسب النوع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {expensesByType.map((type) => (
                <div key={type.value} className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${getTypeColor(type.value)}`}></div>
                      <div className="font-bold text-gray-900">{type.label}</div>
                    </div>
                    <div className="text-sm text-gray-600">{type.count} مصروف</div>
                  </div>
                  <div className="text-lg font-bold text-red-600 mb-2">
                    {formatCurrency(type.total)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(type.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {type.percentage.toFixed(1)}% من الإجمالي
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أدوات البحث والتصفية */}
        <div className="mb-6 space-y-4">
          
          {/* شريط البحث */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="🔍 البحث في المصروفات (الوصف، النوع، الملاحظات...)"
            className="text-lg"
          />

          {/* الفلاتر */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-gray-900">🔍 البحث والتصفية المتقدمة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* فلتر النوع */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع المصروف:</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="all">جميع الأنواع</option>
                  {EXPENSE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* فلتر التاريخ */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الفترة الزمنية:</label>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="all">كل الأوقات</option>
                  <option value="today">اليوم</option>
                  <option value="week">آخر أسبوع</option>
                  <option value="month">هذا الشهر</option>
                  <option value="year">هذا العام</option>
                </select>
              </div>

              {/* الترتيب */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ترتيب حسب:</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="date">التاريخ</option>
                  <option value="amount">المبلغ</option>
                  <option value="type">النوع</option>
                </select>
              </div>

              {/* اتجاه الترتيب */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الاتجاه:</label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">{sortOrder === 'asc' ? '📈' : '📉'}</span>
                  {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
                </button>
              </div>
            </div>

            {/* أدوات التحكم */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setDateFilter('all');
                    setSortBy('date');
                    setSortOrder('desc');
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-200"
                >
                  مسح جميع الفلاتر
                </button>
              </div>
              
              <div className="bg-blue-50 px-4 py-2 rounded-xl">
                <span className="text-sm font-bold text-blue-800">
                  عرض {filteredExpenses.length} مصروف
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* قائمة المصروفات */}
        <div className="mb-6">
          {filteredExpenses.length === 0 && searchTerm ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد نتائج</div>
              <div className="text-gray-500 text-lg">
                لم يتم العثور على مصروفات مطابقة لكلمة البحث "{searchTerm}"
              </div>
            </div>
          ) : filteredExpenses.length === 0 && (filterType !== 'all' || dateFilter !== 'all') ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد مصروفات</div>
              <div className="text-gray-500 text-lg">
                لا توجد مصروفات مطابقة للفلاتر المحددة
              </div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">💸</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد مصروفات</div>
              <div className="text-gray-500 text-lg mb-6">
                ابدأ بإضافة مصروف جديد لتتبع نفقات المكتب
              </div>
              <button
                onClick={handleAddExpense}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                <span className="text-2xl ml-2">➕</span>
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
          title={editingExpense ? '✏️ تعديل المصروف' : '➕ إضافة مصروف جديد'}
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
    </div>
  );
};

// دالة مساعدة للحصول على لون نوع المصروف
const getTypeColor = (type) => {
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

export default ExpensesPage;