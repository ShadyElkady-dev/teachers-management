import React, { useState } from 'react';
import { formatCurrency, formatDate, timeAgo } from '../../utils/helpers';
import { OPERATION_TYPES } from '../../utils/constants';
import Modal from '../Common/Modal';

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
  const [showNotesModal, setShowNotesModal] = useState(null);

  const toggleActions = (operationId) => {
    setShowActions(prev => ({
      ...prev,
      [operationId]: !prev[operationId]
    }));
  };

  const showNotes = (operation) => {
    setShowNotesModal(operation);
  };

  return (
    <>
      <div className="space-y-4">
        {operations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-6xl mb-4">📋</div>
            <div className="font-bold text-xl text-gray-700 mb-2">لا توجد عمليات</div>
            <div className="text-gray-500">لم يتم العثور على أي عمليات مطابقة</div>
          </div>
        ) : (
          operations.map((operation) => (
            <OperationCard
              key={operation.id}
              operation={operation}
              teacher={teachers.find(t => t.id === operation.teacherId)}
              onEdit={onEdit}
              onDelete={onDelete}
              onShowNotes={showNotes}
              showPrices={showPrices}
              canEdit={canEdit}
              canDelete={canDelete}
              showActions={showActions[operation.id]}
              onToggleActions={() => toggleActions(operation.id)}
            />
          ))
        )}
      </div>

      {/* نافذة عرض الملاحظات */}
      <Modal
        isOpen={!!showNotesModal}
        onClose={() => setShowNotesModal(null)}
        title="ملاحظات العملية"
        size="medium"
      >
        {showNotesModal && (
          <div className="p-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-blue-900 text-lg mb-2">
                {OPERATION_TYPES.find(t => t.value === showNotesModal.type)?.label || showNotesModal.type}
              </h3>
              <p className="text-blue-700 mb-2">{showNotesModal.description}</p>
              <p className="text-blue-600 text-sm">📅 {formatDate(showNotesModal.operationDate)}</p>
            </div>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📝</span>
                الملاحظات
              </h4>
              <div className="text-yellow-800 leading-relaxed">
                {showNotesModal.notes || 'لا توجد ملاحظات لهذه العملية'}
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowNotesModal(null)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

// مكون بطاقة العملية المحسنة
const OperationCard = ({ 
  operation, 
  teacher, 
  onEdit, 
  onDelete, 
  onShowNotes,
  showPrices, 
  canEdit, 
  canDelete,
  showActions,
  onToggleActions
}) => {
  const operationType = OPERATION_TYPES.find(type => type.value === operation.type);

  const handleMenuClick = (action) => {
    onToggleActions();
    switch (action) {
      case 'edit':
        onEdit(operation);
        break;
      case 'delete':
        onDelete(operation);
        break;
      case 'notes':
        onShowNotes(operation);
        break;
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative">
      
      {/* رأس البطاقة */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* أيقونة نوع العملية */}
          <div className={`w-14 h-14 ${operationType?.color || 'bg-gray-500'} rounded-xl flex items-center justify-center shadow-lg`}>
            <span className="text-2xl text-white font-bold">
              {operation.type === 'printing' ? '🖨️' :
               operation.type === 'photocopying' ? '📄' :
               operation.type === 'lamination' ? '🛡️' :
               operation.type === 'binding' ? '📚' :
               operation.type === 'design' ? '🎨' :
               operation.type === 'scanning' ? '📷' :
               operation.type === 'cutting' ? '✂️' : '📝'}
            </span>
          </div>
          
          {/* معلومات أساسية */}
          <div>
            <h3 className="font-bold text-gray-900 text-xl leading-tight mb-1">
              {operationType?.label || operation.type}
            </h3>
            <p className="text-gray-600 font-medium mb-1">
              👨‍🏫 {teacher?.name || 'مدرس غير معروف'}
            </p>
            <p className="text-gray-500 text-sm">
              📅 {formatDate(operation.operationDate)} • {timeAgo(operation.operationDate)}
            </p>
          </div>
        </div>

        {/* المبلغ */}
        {showPrices && (
          <div className="text-center bg-green-50 border-2 border-green-200 rounded-xl px-4 py-2">
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(operation.amount)}
            </div>
            <div className="text-xs text-green-600 font-medium">
              مبلغ العملية
            </div>
          </div>
        )}
      </div>

      {/* وصف العملية */}
      <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-800 leading-relaxed font-medium">
          {operation.description}
        </p>
      </div>

      {/* أزرار التحكم */}
      <div className="flex items-center gap-3">
        {/* زر الملاحظات */}
        <button
          onClick={() => onShowNotes(operation)}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
            operation.notes 
              ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-2 border-yellow-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-2 border-gray-300'
          }`}
          title={operation.notes ? 'عرض الملاحظات' : 'لا توجد ملاحظات'}
        >
          <span className="text-lg ml-2">📝</span>
          {operation.notes ? 'عرض الملاحظات' : 'لا توجد ملاحظات'}
        </button>

        {/* أزرار التحكم للأدمن */}
        {(canEdit || canDelete) && (
          <div className="relative">
            <button
              onClick={onToggleActions}
              className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-xl transition-all duration-200 border-2 border-blue-300"
              title="المزيد"
            >
              <span className="text-lg">⚙️</span>
            </button>

            {showActions && (
              <>
                {/* خلفية لإغلاق القائمة */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={onToggleActions}
                />
                
                {/* القائمة المنسدلة */}
                <div className="absolute left-0 mt-2 w-48 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-20">
                  {canEdit && (
                    <button
                      onClick={() => handleMenuClick('edit')}
                      className="w-full text-right px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 font-medium text-blue-700 rounded-t-xl transition-colors"
                    >
                      <span className="text-lg">✏️</span>
                      تعديل العملية
                    </button>
                  )}
                  
                  {canEdit && canDelete && (
                    <div className="border-t border-gray-200"></div>
                  )}
                  
                  {canDelete && (
                    <button
                      onClick={() => handleMenuClick('delete')}
                      className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 font-medium rounded-b-xl transition-colors"
                    >
                      <span className="text-lg">🗑️</span>
                      حذف العملية
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* مؤشر الملاحظات */}
      {operation.notes && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" title="يحتوي على ملاحظات"></div>
      )}
    </div>
  );
};

export default OperationsList;