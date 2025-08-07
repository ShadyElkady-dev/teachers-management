import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatDate, timeAgo, groupBy } from '../../utils/helpers';
import { OPERATION_TYPES, PAYMENT_METHODS } from '../../utils/constants';
import LoadingSpinner from '../Common/LoadingSpinner';

const AccountDetails = ({ 
  teacher, 
  onAddPayment, 
  onEditPayment, 
  onDeletePayment 
}) => {
  const { state, operationsService, paymentsService, calculateTeacherDebt } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview'); // overview, operations, payments, summary
  const [operations, setOperations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // تحميل البيانات عند تغيير المدرس
  useEffect(() => {
    if (teacher) {
      setLoading(true);
      
      // الاستماع لعمليات المدرس
      const unsubscribeOperations = operationsService.subscribeToTeacherOperations(
        teacher.id,
        (snapshot) => {
          const operationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOperations(operationsData);
        }
      );

      // الاستماع لمدفوعات المدرس
      const unsubscribePayments = paymentsService.subscribeToTeacherPayments(
        teacher.id,
        (snapshot) => {
          const paymentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPayments(paymentsData);
          setLoading(false);
        }
      );

      return () => {
        unsubscribeOperations();
        unsubscribePayments();
      };
    }
  }, [teacher]);

  if (!teacher) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">لم يتم اختيار مدرس</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // حساب الإحصائيات
  const debt = calculateTeacherDebt(teacher.id);
  const totalOperations = operations.reduce((sum, op) => sum + (op.amount || 0), 0);
  const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  
  const statistics = {
    debt,
    totalOperations,
    totalPayments,
    operationsCount: operations.length,
    paymentsCount: payments.length,
    averageOperation: operations.length > 0 ? Math.round(totalOperations / operations.length) : 0,
    averagePayment: payments.length > 0 ? totalPayments / payments.length : 0,
    lastOperation: operations.length > 0 
      ? operations.sort((a, b) => b.operationDate?.toDate() - a.operationDate?.toDate())[0]
      : null,
    lastPayment: payments.length > 0 
      ? payments.sort((a, b) => b.paymentDate?.toDate() - a.paymentDate?.toDate())[0]
      : null
  };

  // تجميع العمليات حسب النوع
  const operationsByType = groupBy(operations, 'type');
  const operationsStats = OPERATION_TYPES.map(type => {
    const typeOperations = operations.filter(op => op.type === type.value);
    const total = typeOperations.reduce((sum, op) => sum + (op.amount || 0), 0);
    return {
      ...type,
      count: typeOperations.length,
      total,
      percentage: totalOperations > 0 ? (total / totalOperations) * 100 : 0
    };
  }).filter(type => type.count > 0);

  // تجميع المدفوعات حسب الطريقة
  const paymentsByMethod = groupBy(payments, 'paymentMethod');
  const paymentsStats = PAYMENT_METHODS.map(method => {
    const methodPayments = payments.filter(payment => payment.paymentMethod === method.value);
    const total = methodPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    return {
      ...method,
      count: methodPayments.length,
      total,
      percentage: totalPayments > 0 ? (total / totalPayments) * 100 : 0
    };
  }).filter(method => method.count > 0);

  // عرض نظرة عامة
  const renderOverview = () => (
    <div className="space-y-6">
      
      {/* معلومات المدرس */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">{teacher.name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-900">{teacher.name}</h2>
            <p className="text-blue-700">📞 {teacher.phone}</p>
            {teacher.school && <p className="text-blue-600">🏫 {teacher.school}</p>}
            {teacher.email && <p className="text-blue-600">📧 {teacher.email}</p>}
          </div>
        </div>
        
        {teacher.address && (
          <div className="text-blue-700">
            <span className="font-medium">العنوان: </span>
            {teacher.address}
          </div>
        )}
        
        {teacher.notes && (
          <div className="mt-3 p-3 bg-blue-100 rounded border-l-4 border-blue-400">
            <div className="text-blue-800">
              <span className="font-medium">ملاحظات: </span>
              {teacher.notes}
            </div>
          </div>
        )}
      </div>

      {/* الإحصائيات المالية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-6 rounded-lg border-2 ${
          debt > 0 ? 'bg-red-50 border-red-200' :
          debt === 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="text-center">
            <div className="text-3xl mb-2">
              {debt > 0 ? '⚠️' : debt === 0 ? '✅' : '💰'}
            </div>
            <div className={`text-2xl font-bold ${
              debt > 0 ? 'text-red-600' :
              debt === 0 ? 'text-green-600' : 'text-blue-600'
            }`}>
              {formatCurrency(Math.abs(debt))}
            </div>
            <div className="text-sm text-gray-600">
              {debt > 0 ? 'مديونية' : debt === 0 ? 'مسدد' : 'دفع زائد'}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalOperations)}
            </div>
            <div className="text-sm text-gray-600">إجمالي العمليات</div>
            <div className="text-xs text-gray-500 mt-1">
              {operations.length} عملية
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <div className="text-center">
            <div className="text-3xl mb-2">💳</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPayments)}
            </div>
            <div className="text-sm text-gray-600">إجمالي المدفوعات</div>
            <div className="text-xs text-gray-500 mt-1">
              {payments.length} دفعة
            </div>
          </div>
        </div>
      </div>

      {/* آخر النشاطات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* آخر عملية */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span>
            آخر عملية
          </h3>
          {statistics.lastOperation ? (
            <div>
              <div className="font-medium text-gray-900">
                {OPERATION_TYPES.find(t => t.value === statistics.lastOperation.type)?.label}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {statistics.lastOperation.description}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="font-bold text-blue-600">
                  {formatCurrency(statistics.lastOperation.amount)}
                </span>
                <span className="text-xs text-gray-500">
                  {timeAgo(statistics.lastOperation.operationDate)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              لا توجد عمليات سابقة
            </div>
          )}
        </div>

        {/* آخر دفعة */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💳</span>
            آخر دفعة
          </h3>
          {statistics.lastPayment ? (
            <div>
              <div className="font-medium text-gray-900">
                {PAYMENT_METHODS.find(m => m.value === statistics.lastPayment.paymentMethod)?.label}
              </div>
              {statistics.lastPayment.reference && (
                <div className="text-sm text-gray-600 mt-1">
                  المرجع: {statistics.lastPayment.reference}
                </div>
              )}
              <div className="flex justify-between items-center mt-3">
                <span className="font-bold text-green-600">
                  {formatCurrency(statistics.lastPayment.amount)}
                </span>
                <span className="text-xs text-gray-500">
                  {timeAgo(statistics.lastPayment.paymentDate)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              لا توجد مدفوعات سابقة
            </div>
          )}
        </div>
      </div>

      {/* أزرار الإجراءات السريعة */}
      <div className="flex gap-3">
        <button
          onClick={onAddPayment}
          className="flex-1 btn btn-primary"
        >
          <span className="ml-2">💳</span>
          إضافة دفعة
        </button>
        
        <button
          onClick={() => setActiveTab('operations')}
          className="flex-1 btn btn-secondary"
        >
          <span className="ml-2">📋</span>
          عرض العمليات
        </button>
        
        <button
          onClick={() => setActiveTab('payments')}
          className="flex-1 btn btn-secondary"
        >
          <span className="ml-2">💳</span>
          عرض المدفوعات
        </button>
      </div>
    </div>
  );

  // عرض العمليات
  const renderOperations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          العمليات ({operations.length})
        </h3>
        <div className="text-sm text-gray-600">
          الإجمالي: {formatCurrency(totalOperations)}
        </div>
      </div>

      {operations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا توجد عمليات مسجلة
        </div>
      ) : (
        <div className="space-y-3">
          {operations
            .sort((a, b) => b.operationDate?.toDate() - a.operationDate?.toDate())
            .map(operation => {
              const operationType = OPERATION_TYPES.find(t => t.value === operation.type);
              
              return (
                <div key={operation.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${operationType?.color || 'bg-gray-400'}`}></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {operationType?.label || operation.type}
                        </div>
                        <div className="text-sm text-gray-600">
                          {operation.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(operation.operationDate)} • {timeAgo(operation.operationDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className="font-bold text-blue-600">
                        {formatCurrency(operation.amount)}
                      </div>
                      {operation.quantity && (
                        <div className="text-xs text-gray-500">
                          الكمية: {operation.quantity}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {operation.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      <span className="font-medium">ملاحظات: </span>
                      {operation.notes}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );

  // عرض المدفوعات
  const renderPayments = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          المدفوعات ({payments.length})
        </h3>
        <div className="text-sm text-gray-600">
          الإجمالي: {formatCurrency(totalPayments)}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا توجد مدفوعات مسجلة
        </div>
      ) : (
        <div className="space-y-3">
          {payments
            .sort((a, b) => b.paymentDate?.toDate() - a.paymentDate?.toDate())
            .map(payment => {
              const paymentMethod = PAYMENT_METHODS.find(m => m.value === payment.paymentMethod);
              
              return (
                <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">{paymentMethod?.icon || '💳'}</div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {paymentMethod?.label || payment.paymentMethod}
                        </div>
                        {payment.reference && (
                          <div className="text-sm text-gray-600">
                            المرجع: {payment.reference}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {formatDate(payment.paymentDate)} • {timeAgo(payment.paymentDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className="font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => onEditPayment(payment)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          تعديل
                        </button>
                        <span className="text-xs text-gray-400">•</span>
                        <button
                          onClick={() => onDeletePayment(payment)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {payment.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      <span className="font-medium">ملاحظات: </span>
                      {payment.notes}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );

  // عرض الملخص
  const renderSummary = () => (
    <div className="space-y-6">
      
      {/* ملخص العمليات حسب النوع */}
      {operationsStats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            العمليات حسب النوع
          </h3>
          <div className="space-y-3">
            {operationsStats.map(stat => (
              <div key={stat.value} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${stat.color}`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{stat.label}</div>
                      <div className="text-sm text-gray-600">{stat.count} عملية</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-blue-600">
                      {formatCurrency(stat.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ملخص المدفوعات حسب الطريقة */}
      {paymentsStats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            المدفوعات حسب الطريقة
          </h3>
          <div className="space-y-3">
            {paymentsStats.map(stat => (
              <div key={stat.value} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{stat.icon}</div>
                    <div>
                      <div className="font-medium text-gray-900">{stat.label}</div>
                      <div className="text-sm text-gray-600">{stat.count} دفعة</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-green-600">
                      {formatCurrency(stat.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* إحصائيات إضافية */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          إحصائيات إضافية
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">متوسط العملية:</span>
            <span className="font-semibold mr-2">{formatCurrency(statistics.averageOperation)}</span>
          </div>
          <div>
            <span className="text-gray-600">متوسط الدفعة:</span>
            <span className="font-semibold mr-2">{formatCurrency(statistics.averagePayment)}</span>
          </div>
          <div>
            <span className="text-gray-600">نسبة السداد:</span>
            <span className="font-semibold mr-2">
              {totalOperations > 0 ? ((totalPayments / totalOperations) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">تاريخ التسجيل:</span>
            <span className="font-semibold mr-2">
              {teacher.createdAt ? formatDate(teacher.createdAt) : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* تبويبات التنقل */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: '📊' },
          { id: 'operations', label: 'العمليات', icon: '📋' },
          { id: 'payments', label: 'المدفوعات', icon: '💳' },
          { id: 'summary', label: 'الملخص', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="ml-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* محتوى التبويب */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'operations' && renderOperations()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'summary' && renderSummary()}
      </div>
    </div>
  );
};

export default AccountDetails;