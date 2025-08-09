import React, { useState } from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { generateReportHTML } from './ReportHTMLGenerator';

const ReportPreview = ({ reportData, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const { config, data, metadata } = reportData;
  const isExpensesReport = config.type === 'expenses_report';

  // فلترة البيانات
  const getFilteredData = () => {
    if (isExpensesReport) {
      let filteredExpenses = data.expenses || [];
      
      if (config.dateRange?.from && config.dateRange?.to) {
        const fromDate = new Date(config.dateRange.from);
        const toDate = new Date(config.dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        filteredExpenses = filteredExpenses.filter(expense => {
          const expenseDate = new Date(expense.date || expense.expenseDate || new Date());
          return expenseDate >= fromDate && expenseDate <= toDate;
        });
      }

      if (config.filters?.minAmount) {
        const minAmount = parseFloat(config.filters.minAmount);
        filteredExpenses = filteredExpenses.filter(expense => expense.amount >= minAmount);
      }

      if (config.filters?.maxAmount) {
        const maxAmount = parseFloat(config.filters.maxAmount);
        filteredExpenses = filteredExpenses.filter(expense => expense.amount <= maxAmount);
      }

      return { expenses: filteredExpenses };
    }
    
    let filteredTeachers = data.teachers || [];
    let filteredOperations = data.operations || [];
    let filteredPayments = data.payments || [];

    if (config.dateRange?.from && config.dateRange?.to) {
      const fromDate = new Date(config.dateRange.from);
      const toDate = new Date(config.dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      filteredOperations = filteredOperations.filter(op => {
        const opDate = new Date(op.operationDate);
        return opDate >= fromDate && opDate <= toDate;
      });

      filteredPayments = filteredPayments.filter(p => {
        const payDate = new Date(p.paymentDate);
        return payDate >= fromDate && payDate <= toDate;
      });
    }

    if (config.filters?.minAmount) {
      const minAmount = parseFloat(config.filters.minAmount);
      filteredOperations = filteredOperations.filter(op => op.amount >= minAmount);
      filteredPayments = filteredPayments.filter(p => p.amount >= minAmount);
    }

    if (config.filters?.maxAmount) {
      const maxAmount = parseFloat(config.filters.maxAmount);
      filteredOperations = filteredOperations.filter(op => op.amount <= maxAmount);
      filteredPayments = filteredPayments.filter(p => p.amount <= maxAmount);
    }

    if (config.filters?.hasOperations) {
      const teachersWithOps = [...new Set(filteredOperations.map(op => op.teacherId))];
      filteredTeachers = filteredTeachers.filter(t => teachersWithOps.includes(t.id));
    }

    if (config.filters?.hasDebts) {
      filteredTeachers = filteredTeachers.filter(teacher => {
        const ops = filteredOperations.filter(op => op.teacherId === teacher.id);
        const pays = filteredPayments.filter(p => p.teacherId === teacher.id);
        const totalOps = ops.reduce((sum, op) => sum + (op.amount || 0), 0);
        const totalPays = pays.reduce((sum, p) => sum + (p.amount || 0), 0);
        return totalOps > totalPays;
      });
    }

    return { 
      teachers: filteredTeachers, 
      operations: filteredOperations, 
      payments: filteredPayments 
    };
  };

  const filteredData = getFilteredData();

  // حساب الإحصائيات
  const calculateStats = () => {
    if (isExpensesReport) {
      const expenses = filteredData.expenses || [];
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      
      return {
        totalExpenses,
        expensesCount: expenses.length,
        averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0
      };
    }

    const { teachers, operations, payments } = filteredData;
    const totalOperations = operations.reduce((sum, op) => sum + (op.amount || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalOperations - totalPayments;

    return {
      teachersCount: teachers.length,
      operationsCount: operations.length,
      paymentsCount: payments.length,
      totalOperations,
      totalPayments,
      balance
    };
  };

  const stats = calculateStats();

  // دالة الطباعة
  const handlePrint = () => {
    setIsPrinting(true);
    
    try {
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      const htmlContent = generateReportHTML(config, filteredData, stats);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      alert('حدث خطأ في إنشاء التقرير');
    } finally {
      setIsPrinting(false);
    }
  };

  // عرض تقرير المصروفات
  if (isExpensesReport) {
    const expenses = filteredData.expenses || [];

    return (
      <div className="bg-white min-h-screen">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">معاينة تقرير المصروفات</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {stats.expensesCount} مصروف
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                <FiPrinter size={16} />
                <span>{isPrinting ? 'جاري...' : 'طباعة'}</span>
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{config.title || 'تقرير المصروفات الخاصة'}</h1>
            <div className="text-xs text-gray-600 flex flex-wrap gap-3">
              <span>📅 {formatDate(metadata.generatedAt)}</span>
              <span>👤 {metadata.generatedBy}</span>
              {config.dateRange?.from && (
                <span>📊 {formatDate(config.dateRange.from)} - {formatDate(config.dateRange.to)}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white border border-gray-200 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</div>
              <div className="text-xs text-gray-600">إجمالي المصروفات</div>
            </div>
            <div className="bg-white border border-gray-200 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.expensesCount}</div>
              <div className="text-xs text-gray-600">عدد المصروفات</div>
            </div>
            <div className="bg-white border border-gray-200 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.averageExpense)}</div>
              <div className="text-xs text-gray-600">متوسط المصروف</div>
            </div>
          </div>

          {expenses.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right">#</th>
                    <th className="px-3 py-2 text-right">التاريخ</th>
                    <th className="px-3 py-2 text-right">الوصف</th>
                    <th className="px-3 py-2 text-right">المورد/الجهة</th>
                    <th className="px-3 py-2 text-right">طريقة الدفع</th>
                    <th className="px-3 py-2 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{formatDate(expense.date || expense.expenseDate || new Date())}</td>
                      <td className="px-3 py-2">{expense.description || '-'}</td>
                      <td className="px-3 py-2">{expense.vendor || expense.recipient || '-'}</td>
                      <td className="px-3 py-2">{expense.paymentMethod || '-'}</td>
                      <td className="px-3 py-2 font-semibold text-left">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan="5" className="px-3 py-2 font-semibold">الإجمالي</td>
                    <td className="px-3 py-2 font-bold text-left">{formatCurrency(stats.totalExpenses)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">💰</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">لا توجد مصروفات</h3>
              <p className="text-gray-600 text-sm">لا توجد مصروفات تطابق معايير التصفية المحددة</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // عرض تقرير المدرسين
  const { teachers, operations, payments } = filteredData;

  const getTeacherData = (teacher) => {
    const teacherOps = operations.filter(op => op.teacherId === teacher.id);
    const teacherPays = payments.filter(p => p.teacherId === teacher.id);
    const totalOps = teacherOps.reduce((sum, op) => sum + (op.amount || 0), 0);
    const totalPays = teacherPays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalOps - totalPays;

    return {
      operations: teacherOps,
      payments: teacherPays,
      totalOperations: totalOps,
      totalPayments: totalPays,
      balance
    };
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">معاينة التقرير</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {stats.teachersCount} مدرس • {stats.operationsCount} عملية • {stats.paymentsCount} دفعة
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <FiPrinter size={16} />
              <span>{isPrinting ? 'جاري...' : 'طباعة'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <div className="text-xs text-gray-600 flex flex-wrap gap-3">
            <span>📅 {formatDate(metadata.generatedAt)}</span>
            <span>👤 {metadata.generatedBy}</span>
            {config.dateRange?.from && (
              <span>📊 {formatDate(config.dateRange.from)} - {formatDate(config.dateRange.to)}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalOperations)}</div>
            <div className="text-xs text-gray-600">إجمالي العمليات</div>
          </div>
          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPayments)}</div>
            <div className="text-xs text-gray-600">إجمالي المدفوعات</div>
          </div>
          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <div className={`text-2xl font-bold ${stats.balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {formatCurrency(Math.abs(stats.balance))}
            </div>
            <div className="text-xs text-gray-600">{stats.balance > 0 ? 'إجمالي المستحق' : 'الرصيد'}</div>
          </div>
        </div>

        <div className="space-y-4">
          {teachers.map((teacher, index) => {
            const teacherData = getTeacherData(teacher);
            const showOperations = config.includedSections?.operations !== false;
            const showPayments = config.includedSections?.payments !== false;
            const showBalance = config.includedSections?.balance !== false;

            return (
              <div key={teacher.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {index + 1}. {teacher.name || 'مدرس غير معروف'}
                      </h3>
                      <span className="text-xs text-gray-500">ID: {teacher.id}</span>
                    </div>
                    {showBalance && (
                      <div className="text-right">
                        <div className={`text-lg font-bold ${teacherData.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(teacherData.balance))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {teacherData.balance > 0 ? 'مستحق' : teacherData.balance < 0 ? 'رصيد إضافي' : 'متوازن'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {showOperations && teacherData.operations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 العمليات ({teacherData.operations.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-right">التاريخ</th>
                              <th className="px-2 py-1 text-right">النوع</th>
                              <th className="px-2 py-1 text-right">الوصف</th>
                              <th className="px-2 py-1 text-center">الكمية</th>
                              <th className="px-2 py-1 text-left">المبلغ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherData.operations.map((op, i) => (
                              <tr key={i} className="border-t border-gray-100">
                                <td className="px-2 py-2">{formatDate(op.operationDate)}</td>
                                <td className="px-2 py-2">{op.type || '-'}</td>
                                <td className="px-2 py-2">{op.description || '-'}</td>
                                <td className="px-2 py-2 text-center">{op.quantity || 0}</td>
                                <td className="px-2 py-2 font-semibold text-left">{formatCurrency(op.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 bg-gray-50">
                              <td colSpan="4" className="px-2 py-1 font-semibold">الإجمالي</td>
                              <td className="px-2 py-1 font-bold text-left">{formatCurrency(teacherData.totalOperations)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {showPayments && teacherData.payments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">💰 المدفوعات ({teacherData.payments.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-right">التاريخ</th>
                              <th className="px-2 py-1 text-right">طريقة الدفع</th>
                              <th className="px-2 py-1 text-right">ملاحظات</th>
                              <th className="px-2 py-1 text-left">المبلغ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherData.payments.map((payment, i) => (
                              <tr key={i} className="border-t border-gray-100">
                                <td className="px-2 py-2">{formatDate(payment.paymentDate)}</td>
                                <td className="px-2 py-2">{payment.paymentMethod || '-'}</td>
                                <td className="px-2 py-2">{payment.notes || '-'}</td>
                                <td className="px-2 py-2 font-semibold text-left">{formatCurrency(payment.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 bg-gray-50">
                              <td colSpan="3" className="px-2 py-1 font-semibold">الإجمالي</td>
                              <td className="px-2 py-1 font-bold text-left">{formatCurrency(teacherData.totalPayments)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {showBalance && (
                    <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded text-xs">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{formatCurrency(teacherData.totalOperations)}</div>
                        <div className="text-gray-500">العمليات</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{formatCurrency(teacherData.totalPayments)}</div>
                        <div className="text-gray-500">المدفوعات</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${teacherData.balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatCurrency(Math.abs(teacherData.balance))}
                        </div>
                        <div className="text-gray-500">{teacherData.balance > 0 ? 'المستحق' : 'الرصيد'}</div>
                      </div>
                    </div>
                  )}

                  {teacherData.operations.length === 0 && teacherData.payments.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      لا توجد بيانات لهذا المدرس في الفترة المحددة
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {teachers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">لا توجد بيانات</h3>
            <p className="text-gray-600 text-sm">لا توجد بيانات تطابق معايير التصفية المحددة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPreview;