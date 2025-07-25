import React, { useState } from 'react';
import { formatCurrency, formatDate, timeAgo } from '../../utils/helpers';

const AccountsList = ({ 
  teachers, 
  onAddPayment, 
  onEditPayment, 
  onDeletePayment, 
  onViewDetails 
}) => {
  const [showActions, setShowActions] = useState({});

  const toggleActions = (teacherId) => {
    setShowActions(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">المدرس</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">إجمالي العمليات</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">إجمالي المدفوعات</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">المديونية</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">آخر دفعة</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الحالة</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {teachers.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">💰</div>
                  <div className="font-medium">لا توجد حسابات</div>
                  <div className="text-sm mt-1">لم يتم العثور على أي حسابات مطابقة</div>
                </div>
              </td>
            </tr>
          ) : (
            teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                {/* المدرس */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ml-3 shadow-md">
                      <span className="text-white font-bold text-lg">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                      <div className="text-sm text-gray-500">📞 {teacher.phone}</div>
                      {teacher.school && (
                        <div className="text-xs text-gray-400">🏫 {teacher.school}</div>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* إجمالي العمليات */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrency(teacher.totalOperations)}
                  </div>
                  <div className="text-xs text-gray-500">{teacher.operationsCount} عملية</div>
                </td>
                
                {/* إجمالي المدفوعات */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(teacher.totalPayments)}
                  </div>
                  <div className="text-xs text-gray-500">{teacher.paymentsCount} دفعة</div>
                </td>
                
                {/* المديونية */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className={`text-xl font-bold ${
                    teacher.debt > 0 ? 'text-red-600' :
                    teacher.debt === 0 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {formatCurrency(Math.abs(teacher.debt))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {teacher.debt > 0 ? 'دين' :
                     teacher.debt === 0 ? 'مسدد' : 'زائد'}
                  </div>
                </td>
                
                {/* آخر دفعة */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {teacher.lastPayment ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(teacher.lastPayment.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(teacher.lastPayment.paymentDate)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {timeAgo(teacher.lastPayment.paymentDate)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">لا توجد دفعات</div>
                  )}
                </td>
                
                {/* الحالة */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    teacher.debt > 0 
                      ? 'bg-red-100 text-red-800' 
                      : teacher.debt === 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    <span className="ml-1">
                      {teacher.debt > 0 ? '⚠️' : teacher.debt === 0 ? '✅' : '💰'}
                    </span>
                    {teacher.debt > 0 ? 'مديون' :
                     teacher.debt === 0 ? 'مسدد' : 'دفع زائد'}
                  </span>
                  
                  {/* مؤشرات إضافية */}
                  <div className="flex justify-center gap-1 mt-1">
                    {teacher.debt > 1000 && (
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full" title="دين عالي"></span>
                    )}
                    {teacher.paymentsCount === 0 && teacher.operationsCount > 0 && (
                      <span className="inline-block w-2 h-2 bg-orange-500 rounded-full" title="لم يدفع أبداً"></span>
                    )}
                  </div>
                </td>
                
                {/* الإجراءات */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* إضافة دفعة */}
                    <button
                      onClick={() => onAddPayment(teacher)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      title="إضافة دفعة"
                    >
                      💳 دفعة
                    </button>
                    
                    {/* عرض التفاصيل */}
                    <button
                      onClick={() => onViewDetails(teacher)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      title="عرض التفاصيل"
                    >
                      👁️ تفاصيل
                    </button>
                    
                    {/* قائمة إضافية */}
                    <div className="relative">
                      <button
                        onClick={() => toggleActions(teacher.id)}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                        title="المزيد"
                      >
                        <span className="text-lg">⋮</span>
                      </button>

                      {showActions[teacher.id] && (
                        <>
                          {/* خلفية لإغلاق القائمة */}
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => toggleActions(teacher.id)}
                          />
                          
                          {/* القائمة المنسدلة */}
                          <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button
                              onClick={() => {
                                onViewDetails(teacher);
                                toggleActions(teacher.id);
                              }}
                              className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                            >
                              <span>📊</span>
                              كشف حساب كامل
                            </button>
                            
                            <div className="border-t border-gray-200"></div>
                            
                            <button
                              onClick={() => {
                                onAddPayment(teacher);
                                toggleActions(teacher.id);
                              }}
                              className="w-full text-right px-4 py-3 text-sm hover:bg-green-50 text-green-700 flex items-center gap-2 rounded-b-lg"
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
            ))
          )}
        </tbody>
      </table>
      
      {/* ملخص الجدول */}
      {teachers.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              عرض {teachers.length} حساب
            </div>
            <div className="flex items-center gap-6 text-gray-700">
              <div>
                <span className="font-medium">إجمالي الديون: </span>
                <span className="font-bold text-red-600">
                  {formatCurrency(teachers.reduce((sum, t) => sum + Math.max(0, t.debt), 0))}
                </span>
              </div>
              <div>
                <span className="font-medium">إجمالي المدفوعات: </span>
                <span className="font-bold text-green-600">
                  {formatCurrency(teachers.reduce((sum, t) => sum + t.totalPayments, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsList;