import React, { useState } from 'react';
import { formatCurrency, formatDate, timeAgo } from '../../utils/helpers';
import { OPERATION_TYPES } from '../../utils/constants';

const OperationsList = ({ 
  operations, 
  teachers,
  onEdit, 
  onDelete,
  showPrices = true,
  canEdit = false,
  canDelete = false
}) => {
  const [showActions, setShowActions] = useState({});

  const toggleActions = (operationId) => {
    setShowActions(prev => ({
      ...prev,
      [operationId]: !prev[operationId]
    }));
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">التاريخ</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">المدرس</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">النوع</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">الوصف</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الكمية</th>
            {showPrices && (
              <>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">سعر الوحدة</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">المبلغ الإجمالي</th>
              </>
            )}
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">التفاصيل</th>
            {(canEdit || canDelete) && (
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الإجراءات</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {operations.length === 0 ? (
            <tr>
              <td 
                colSpan={showPrices ? (canEdit || canDelete ? 9 : 8) : (canEdit || canDelete ? 7 : 6)} 
                className="px-6 py-12 text-center text-gray-500"
              >
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">📋</div>
                  <div className="font-medium">لا توجد عمليات</div>
                  <div className="text-sm mt-1">لم يتم العثور على أي عمليات مطابقة</div>
                </div>
              </td>
            </tr>
          ) : (
            operations.map((operation) => {
              const teacher = teachers.find(t => t.id === operation.teacherId);
              const operationType = OPERATION_TYPES.find(t => t.value === operation.type);
              
              return (
                <tr key={operation.id} className="hover:bg-gray-50 transition-colors">
                  {/* التاريخ */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(operation.operationDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {timeAgo(operation.operationDate)}
                    </div>
                  </td>
                  
                  {/* المدرس */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center ml-3">
                        <span className="text-blue-600 font-bold text-sm">
                          {teacher?.name?.charAt(0) || '؟'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {teacher?.name || 'غير معروف'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {teacher?.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* النوع */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ml-2 ${
                        operationType?.color?.replace('bg-', 'bg-') || 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {operationType?.label || operation.type}
                      </span>
                    </div>
                  </td>
                  
                  {/* الوصف */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      <div className="line-clamp-2" title={operation.description}>
                        {operation.description}
                      </div>
                    </div>
                  </td>
                  
                  {/* الكمية */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {operation.quantity || 1}
                    </span>
                  </td>
                  
                  {/* الأسعار - للأدمن فقط */}
                  {showPrices && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(operation.unitPrice || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(operation.amount || 0)}
                        </span>
                      </td>
                    </>
                  )}
                  
                  {/* التفاصيل الإضافية */}
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 space-y-1">
                      {operation.paperSize && (
                        <div>📄 {operation.paperSize}</div>
                      )}
                      {operation.printType && (
                        <div>🖨️ {operation.printType}</div>
                      )}
                      {operation.notes && (
                        <div title={operation.notes} className="truncate max-w-32">
                          📝 {operation.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* الإجراءات */}
                  {(canEdit || canDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="relative">
                        <button
                          onClick={() => toggleActions(operation.id)}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                          title="المزيد"
                        >
                          <span className="text-lg">⋮</span>
                        </button>

                        {showActions[operation.id] && (
                          <>
                            {/* خلفية لإغلاق القائمة */}
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => toggleActions(operation.id)}
                            />
                            
                            {/* القائمة المنسدلة */}
                            <div className="absolute left-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    onEdit(operation);
                                    toggleActions(operation.id);
                                  }}
                                  className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                                >
                                  <span>✏️</span>
                                  تعديل العملية
                                </button>
                              )}
                              
                              {canEdit && canDelete && (
                                <div className="border-t border-gray-200"></div>
                              )}
                              
                              {canDelete && (
                                <button
                                  onClick={() => {
                                    onDelete(operation);
                                    toggleActions(operation.id);
                                  }}
                                  className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-lg"
                                >
                                  <span>🗑️</span>
                                  حذف العملية
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      
      {/* معلومات الجدول */}
      {operations.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              عرض {operations.length} عملية
            </div>
            {showPrices && (
              <div className="font-medium">
                الإجمالي: {formatCurrency(operations.reduce((sum, op) => sum + (op.amount || 0), 0))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsList;