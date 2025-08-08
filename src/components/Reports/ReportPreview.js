import React, { useState } from 'react';
import { FiX, FiFileText, FiPrinter } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { generateReportHTML } from './ReportHTMLGenerator';

const ReportPreview = ({ reportData, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const { config, data, metadata } = reportData;

  // فلترة البيانات حسب الإعدادات
  const getFilteredData = () => {
    let filteredTeachers = data.teachers || [];
    let filteredOperations = data.operations || [];
    let filteredPayments = data.payments || [];

    // تطبيق فلتر التاريخ
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

    // تطبيق فلتر المبلغ
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

    // فلتر المدرسين حسب العمليات
    if (config.filters?.hasOperations) {
      const teachersWithOps = [...new Set(filteredOperations.map(op => op.teacherId))];
      filteredTeachers = filteredTeachers.filter(t => teachersWithOps.includes(t.id));
    }

    // فلتر المدرسين حسب المديونيات
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

  const { teachers, operations, payments } = getFilteredData();

  // حساب الإحصائيات
  const calculateStats = () => {
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
      const htmlContent = generateReportHTML(config, { teachers, operations, payments }, stats);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      alert('حدث خطأ في إنشاء التقرير');
    } finally {
      setIsPrinting(false);
    }
  };

  // حساب بيانات كل مدرس
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
      {/* الهيدر */}
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
        {/* معلومات التقرير */}
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

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
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

        {/* بيانات المدرسين */}
        <div className="space-y-4">
          {teachers.map((teacher, index) => {
            const teacherData = getTeacherData(teacher);
            // التحقق من الأقسام المطلوبة
            const showOperations = config.includedSections?.operations === true || 
                                 (config.includedSections?.operations === undefined && true);
            const showPayments = config.includedSections?.payments === true || 
                               (config.includedSections?.payments === undefined && true);
            const showBalance = config.includedSections?.balance === true || 
                              (config.includedSections?.balance === undefined && true);

            return (
              <div key={teacher.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* رأس البطاقة */}
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
                  {/* العمليات */}
                  {showOperations && teacherData.operations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 العمليات ({teacherData.operations.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-right whitespace-nowrap">التاريخ</th>
                              <th className="px-2 py-1 text-right">النوع</th>
                              <th className="px-2 py-1 text-right min-w-[200px]">الوصف</th>
                              <th className="px-2 py-1 text-center">الكمية</th>
                              <th className="px-2 py-1 text-left whitespace-nowrap">المبلغ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherData.operations.map((op, i) => (
                              <tr key={i} className="border-t border-gray-100">
                                <td className="px-2 py-2 text-xs whitespace-nowrap">{formatDate(op.operationDate)}</td>
                                <td className="px-2 py-2 text-xs">{op.type || '-'}</td>
                                <td className="px-2 py-2 text-xs">
                                  <div className="break-words whitespace-pre-wrap leading-relaxed">{op.description || '-'}</div>
                                </td>
                                <td className="px-2 py-2 text-center text-xs">{op.quantity || 0}</td>
                                <td className="px-2 py-2 font-semibold text-xs whitespace-nowrap">{formatCurrency(op.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 bg-gray-50">
                              <td colSpan="4" className="px-2 py-1 font-semibold">الإجمالي</td>
                              <td className="px-2 py-1 font-bold">{formatCurrency(teacherData.totalOperations)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* المدفوعات */}
                  {showPayments && teacherData.payments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">💰 المدفوعات ({teacherData.payments.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-right whitespace-nowrap">التاريخ</th>
                              <th className="px-2 py-1 text-right">طريقة الدفع</th>
                              <th className="px-2 py-1 text-right min-w-[150px]">ملاحظات</th>
                              <th className="px-2 py-1 text-left whitespace-nowrap">المبلغ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherData.payments.map((payment, i) => (
                              <tr key={i} className="border-t border-gray-100">
                                <td className="px-2 py-2 text-xs whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                                <td className="px-2 py-2 text-xs">{payment.paymentMethod || '-'}</td>
                                <td className="px-2 py-2 text-xs">
                                  <div className="break-words whitespace-pre-wrap leading-relaxed">{payment.notes || '-'}</div>
                                </td>
                                <td className="px-2 py-2 font-semibold text-xs whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 bg-gray-50">
                              <td colSpan="3" className="px-2 py-1 font-semibold">الإجمالي</td>
                              <td className="px-2 py-1 font-bold">{formatCurrency(teacherData.totalPayments)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* الملخص */}
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

                  {/* لا توجد بيانات */}
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

        {/* إذا لم توجد بيانات */}
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