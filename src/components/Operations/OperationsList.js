import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate, formatDateTime, isSmallScreen } from '../../utils/helpers';
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
  const [showNotesModal, setShowNotesModal] = useState(null);
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
      <div className="text-6xl mb-4">📋</div>
      <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد عمليات</div>
      <div className="text-gray-500 text-lg">لم يتم العثور على أي عمليات مطابقة</div>
    </div>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {operations.map(operation => (
        <OperationCardEnhanced
          key={operation.id}
          operation={operation}
          teacher={teachers.find(t => t.id === operation.teacherId)}
          onEdit={onEdit}
          onDelete={onDelete}
          onShowNotes={() => setShowNotesModal(operation)}
          showPrices={showPrices}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">التاريخ</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المدرس</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">النوع</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الوصف</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الكمية</th>
              {showPrices && (
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">المبلغ</th>
              )}
              {(canEdit || canDelete) && (
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {operations.map(operation => (
              <OperationTableRow
                key={operation.id}
                operation={operation}
                teacher={teachers.find(t => t.id === operation.teacherId)}
                onEdit={onEdit}
                onDelete={onDelete}
                onShowNotes={() => setShowNotesModal(operation)}
                showPrices={showPrices}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
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
          
          <div className="text-sm text-gray-600">
            عرض {operations.length} عملية
          </div>
        </div>
      )}

      {operations.length === 0 ? renderEmptyState() : (
        viewMode === 'cards' ? renderCardsView() : renderTableView()
      )}

      <Modal
        isOpen={!!showNotesModal}
        onClose={() => setShowNotesModal(null)}
        title="ملاحظات العملية"
        size="medium"
      >
        {showNotesModal && (
          <div className="p-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-blue-900 text-xl mb-3">
                {OPERATION_TYPES.find(t => t.value === showNotesModal.type)?.label || showNotesModal.type}
              </h3>
              <p className="text-blue-700 mb-3 text-lg break-all" style={{wordBreak: 'break-all'}}>{showNotesModal.description}</p>
              <p className="text-blue-600 text-sm">📅 {formatDate(showNotesModal.operationDate)}</p>
            </div>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
              <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">📝</span>
                الملاحظات
              </h4>
              <div className="text-yellow-800 leading-relaxed text-lg">
                {showNotesModal.notes || 'لا توجد ملاحظات لهذه العملية'}
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowNotesModal(null)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl transition-all duration-200 text-lg shadow-lg hover:shadow-xl"
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

const OperationCardEnhanced = ({ 
  operation, 
  teacher, 
  onEdit, 
  onDelete, 
  onShowNotes,
  showPrices, 
  canEdit, 
  canDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const operationType = OPERATION_TYPES.find(type => type.value === operation.type);

  const getOperationIcon = () => {
    switch (operation.type) {
      case 'printing': return '🖨️';
      case 'photocopying': return '📄';
      case 'lamination': return '🛡️';
      case 'binding': return '📚';
      case 'design': return '🎨';
      case 'scanning': return '📷';
      case 'cutting': return '✂️';
      default: return '📝';
    }
  };

  const getCardColor = () => {
    switch (operation.type) {
      case 'printing': return 'from-blue-500 to-blue-600';
      case 'photocopying': return 'from-green-500 to-green-600';
      case 'lamination': return 'from-yellow-500 to-yellow-600';
      case 'binding': return 'from-purple-500 to-purple-600';
      case 'design': return 'from-pink-500 to-pink-600';
      case 'scanning': return 'from-indigo-500 to-indigo-600';
      case 'cutting': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const handleMenuClick = (action) => {
    setShowMenu(false);
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
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 flex flex-col">
      <div className={`bg-gradient-to-r ${getCardColor()} p-6 text-white relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl">{getOperationIcon()}</span>
            </div>
            <div>
              <h3 className="font-bold text-xl leading-tight mb-1">{operationType?.label || operation.type}</h3>
              <p className="text-sm opacity-90 mb-1">👨‍🏫 {teacher?.name || 'مدرس غير معروف'}</p>
<p className="text-xs opacity-80">📅 {formatDateTime(operation.operationDate)}</p>
            </div>
          </div>
          {showPrices && (
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(operation.amount)}</div>
              <div className="text-xs opacity-90">المبلغ</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-gray-800 leading-relaxed font-medium break-all" style={{wordBreak: 'break-all'}}>
              {operation.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-xl font-bold text-blue-700">{operation.quantity || 1}</div>
            <div className="text-xs text-blue-600 font-medium">الكمية</div>
          </div>
          
        </div>

        {operation.notes && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📝</span>
              <span className="font-medium text-yellow-900">ملاحظات</span>
            </div>
            <p className="text-yellow-800 text-sm leading-relaxed break-all" style={{wordBreak: 'break-all'}}>
              {operation.notes.length > 100 ? `${operation.notes.substring(0, 100)}...` : operation.notes}
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-auto pt-6 border-t">
          <button
            onClick={() => onShowNotes(operation)}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-lg ${
              operation.notes 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-2 border-gray-300'
            }`}
            title={operation.notes ? 'عرض الملاحظات' : 'لا توجد ملاحظات'}
          >
            <span className="text-lg ml-1">📝</span>
            {operation.notes ? 'الملاحظات' : 'لا توجد'}
          </button>

          {(canEdit || canDelete) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-xl transition-all duration-200 border-2 border-blue-300"
                title="المزيد"
              >
                <span className="text-lg">⚙️</span>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}/>
                  <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-20">
                    {canEdit && (
                      <button
                        onClick={() => handleMenuClick('edit')}
                        className="w-full text-right px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 font-medium text-blue-700 rounded-t-2xl transition-colors"
                      >
                        <span className="text-lg">✏️</span>
                        تعديل العملية
                      </button>
                    )}
                    {canEdit && canDelete && <div className="border-t border-gray-200"></div>}
                    {canDelete && (
                      <button
                        onClick={() => handleMenuClick('delete')}
                        className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 font-medium rounded-b-2xl transition-colors"
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
      </div>
      
      {operation.notes && (
        <div className="absolute top-3 right-3 w-4 h-4 bg-yellow-500 rounded-full animate-pulse" title="يحتوي على ملاحظات"></div>
      )}
    </div>
  );
};

const OperationTableRow = ({
  operation,
  teacher,
  onEdit,
  onDelete,
  onShowNotes,
  showPrices,
  canEdit,
  canDelete
}) => {
  const operationType = OPERATION_TYPES.find(t => t.value === operation.type);

  const getOperationIcon = () => {
    switch (operation.type) {
      case 'printing': return '🖨️';
      case 'photocopying': return '📄';
      case 'lamination': return '🛡️';
      case 'binding': return '📚';
      case 'design': return '🎨';
      case 'scanning': return '📷';
      case 'cutting': return '✂️';
      default: return '📝';
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
<td className="px-6 py-4 whitespace-nowrap">
    <div className="text-sm font-medium text-gray-900">{formatDateTime(operation.operationDate)}</div>
</td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ml-3 shadow-md">
            <span className="text-white font-bold text-sm">{teacher?.name?.charAt(0) || '؟'}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{teacher?.name || 'غير معروف'}</div>
            <div className="text-xs text-gray-500">{teacher?.phone}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-lg ml-2">{getOperationIcon()}</span>
          <div>
            <span className="text-sm font-medium text-gray-900">{operationType?.label || operation.type}</span>
            <div className={`inline-block w-3 h-3 rounded-full ml-2 ${operationType?.color?.replace('bg-', 'bg-') || 'bg-gray-400'}`}></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 max-w-xs">
        <div className="text-sm text-gray-900 whitespace-normal break-all">{operation.description}</div>
        {operation.notes && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-500">📝</span>
            <span className="text-xs text-gray-500 line-clamp-1" title={operation.notes}>
              {operation.notes.length > 30 ? `${operation.notes.substring(0, 30)}...` : operation.notes}
            </span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="bg-blue-100 rounded-full px-3 py-1 inline-block">
          <span className="text-sm font-bold text-blue-800">{operation.quantity || 1}</span>
        </div>
      </td>
      {showPrices && (
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <div className="bg-green-100 rounded-full px-3 py-1 inline-block">
            <span className="text-sm font-bold text-green-800">{formatCurrency(operation.amount || 0)}</span>
          </div>
        </td>
      )}
      {(canEdit || canDelete) && (
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onShowNotes(operation)}
              className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-lg transition-colors"
              title="عرض الملاحظات"
            >
              📝
            </button>
            {canEdit && (
              <button
                onClick={() => onEdit(operation)}
                className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg transition-colors"
                title="تعديل"
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(operation)}
                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg transition-colors"
                title="حذف"
              >
                🗑️
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};

export default OperationsList;