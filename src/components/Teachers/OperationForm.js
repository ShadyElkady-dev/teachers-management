import React, { useState, useEffect } from 'react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { dateToInputValue, sanitizeText } from '../../utils/helpers';
import { OPERATION_TYPES } from '../../utils/constants';
import LoadingSpinner from '../Common/LoadingSpinner';

const OperationForm = ({ 
  operation = null, 
  teacher = null,
  onSave, 
  onCancel, 
  loading = false 
}) => {
  const { hasPermission } = useAuth();
  const canViewPrices = hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES);

  // حالة النموذج
  const [formData, setFormData] = useState({
    type: 'printing',
    customType: '',
    description: '',
    amount: '',
    operationDate: dateToInputValue(new Date()),
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // تعبئة النموذج عند التعديل
  useEffect(() => {
    if (operation) {
      setFormData({
        type: operation.type || 'printing',
        customType: OPERATION_TYPES.find(t => t.value === operation.type) ? '' : operation.type,
        description: operation.description || '',
        amount: operation.amount?.toString() || '',
        operationDate: dateToInputValue(operation.operationDate),
        notes: operation.notes || ''
      });
    }
  }, [operation]);

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};

    // نوع العملية
    if (!formData.type) {
      newErrors.type = 'نوع العملية مطلوب';
    }

    // النوع المخصص
    if (formData.type === 'other' && !formData.customType.trim()) {
      newErrors.customType = 'يرجى تحديد نوع العملية';
    }

    // وصف العملية
    if (!formData.description.trim()) {
      newErrors.description = 'وصف العملية مطلوب';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'وصف العملية يجب أن يكون أكثر من 3 أحرف';
    }

    // المبلغ (للأدمن فقط)
    if (canViewPrices) {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
      } else if (parseFloat(formData.amount) > 999999) {
        newErrors.amount = 'المبلغ كبير جداً';
      }
    }

    // تاريخ العملية
    if (!formData.operationDate) {
      newErrors.operationDate = 'تاريخ العملية مطلوب';
    } else {
      const selectedDate = new Date(formData.operationDate);
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      
      if (selectedDate > today) {
        newErrors.operationDate = 'لا يمكن أن يكون تاريخ العملية في المستقبل';
      } else if (selectedDate < oneYearAgo) {
        newErrors.operationDate = 'تاريخ العملية قديم جداً';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // معالجة تغيير القيم
  const handleChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'description' || field === 'notes' || field === 'customType') {
      processedValue = sanitizeText(value);
    } else if (field === 'amount') {
      processedValue = Math.max(0, parseFloat(value) || 0);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // إزالة الخطأ عند تعديل الحقل
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // معالجة التركيز على الحقل
  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // معالجة إرسال النموذج
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // تعيين جميع الحقول كـ touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (validateForm()) {
      // إعداد البيانات للإرسال
      const dataToSave = {
        type: formData.type === 'other' ? formData.customType : formData.type,
        description: formData.description,
        operationDate: new Date(formData.operationDate),
        notes: formData.notes,
        quantity: 1 // قيمة افتراضية
      };

      // إضافة المبلغ للأدمن أو قيمة افتراضية للسكرتارية
      if (canViewPrices) {
        dataToSave.amount = parseFloat(formData.amount);
        dataToSave.unitPrice = parseFloat(formData.amount);
      } else {
        // للسكرتارية: قيم افتراضية
        dataToSave.amount = 1;
        dataToSave.unitPrice = 1;
      }

      onSave(dataToSave);
    }
  };

  // تحديد ما إذا كان الحقل يحتوي على خطأ
  const hasError = (field) => {
    return touched[field] && errors[field];
  };

  // الحصول على نوع العملية المحدد
  const selectedOperationType = OPERATION_TYPES.find(type => type.value === formData.type);

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* معلومات المدرس */}
        {teacher && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{teacher.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">{teacher.name}</h3>
                <p className="text-blue-700 font-medium">📞 {teacher.phone}</p>
                {teacher.school && (
                  <p className="text-blue-600 text-sm">🏫 {teacher.school}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* نوع العملية */}
        <div>
          <label htmlFor="type" className="block text-sm font-semibold text-gray-800 mb-2">
            نوع العملية <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            onBlur={() => handleBlur('type')}
            className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-200 ${
              hasError('type') 
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            disabled={loading}
          >
            {OPERATION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {hasError('type') && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {errors.type}
            </p>
          )}
        </div>

        {/* النوع المخصص (يظهر عند اختيار "أخرى") */}
        {formData.type === 'other' && (
          <div>
            <label htmlFor="customType" className="block text-sm font-semibold text-gray-800 mb-2">
              نوع العملية المخصص <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customType"
              value={formData.customType}
              onChange={(e) => handleChange('customType', e.target.value)}
              onBlur={() => handleBlur('customType')}
              className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-200 ${
                hasError('customType') 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
              placeholder="أدخل نوع العملية"
              disabled={loading}
            />
            {hasError('customType') && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.customType}
              </p>
            )}
          </div>
        )}

        {/* وصف العملية */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
            وصف العملية <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-200 resize-none ${
              hasError('description') 
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            placeholder="وصف تفصيلي للعملية المطلوبة"
            disabled={loading}
            rows="4"
          />
          {hasError('description') && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {errors.description}
            </p>
          )}
        </div>

        {/* المبلغ الإجمالي - فقط للأدمن */}
        <PermissionGate 
          permission={PERMISSIONS.VIEW_OPERATION_PRICES}
          fallback={
            <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4">
              <div className="flex items-center justify-center text-gray-600">
                <span className="text-2xl ml-2">🔒</span>
                <div>
                  <div className="font-semibold">المبلغ الإجمالي</div>
                  <div className="text-sm">سيتم حساب المبلغ تلقائياً</div>
                </div>
              </div>
            </div>
          }
        >
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-800 mb-2">
              المبلغ الإجمالي (جنيه) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              onBlur={() => handleBlur('amount')}
              className={`w-full px-4 py-3 border-2 rounded-xl text-base font-bold bg-white transition-all duration-200 ${
                hasError('amount') 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100'
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={loading}
            />
            {hasError('amount') && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.amount}
              </p>
            )}
          </div>
        </PermissionGate>

        {/* تاريخ العملية */}
        <div>
          <label htmlFor="operationDate" className="block text-sm font-semibold text-gray-800 mb-2">
            تاريخ العملية <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="operationDate"
            value={formData.operationDate}
            onChange={(e) => handleChange('operationDate', e.target.value)}
            onBlur={() => handleBlur('operationDate')}
            className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-200 ${
              hasError('operationDate') 
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            disabled={loading}
          />
          {hasError('operationDate') && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {errors.operationDate}
            </p>
          )}
        </div>

        {/* ملاحظات */}
        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-800 mb-2">
            ملاحظات
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            onBlur={() => handleBlur('notes')}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
            placeholder="أي ملاحظات إضافية حول العملية"
            disabled={loading}
            rows="3"
          />
        </div>

        {/* ملخص العملية */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
          <h4 className="font-bold text-green-900 mb-3 text-lg">📋 ملخص العملية</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">النوع:</span>
              <span className="font-bold mr-2 text-green-900">
                {formData.type === 'other' ? formData.customType : selectedOperationType?.label}
              </span>
            </div>
            <div>
              <span className="text-green-700 font-medium">التاريخ:</span>
              <span className="font-bold mr-2 text-green-900">
                {formData.operationDate ? new Date(formData.operationDate).toLocaleDateString('ar-EG') : '-'}
              </span>
            </div>
            
            {/* إظهار المبلغ فقط للأدمن */}
            <PermissionGate permission={PERMISSIONS.VIEW_OPERATION_PRICES}>
              <div className="md:col-span-2">
                <span className="text-green-700 font-medium">المبلغ الإجمالي:</span>
                <span className="font-bold text-xl mr-2 text-green-900">
                  {formData.amount ? `${parseFloat(formData.amount).toFixed(2)} جنيه` : '0.00 جنيه'}
                </span>
              </div>
            </PermissionGate>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg ml-2">❌</span>
            إلغاء
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="small" color="white" />
                <span className="mr-2">جاري الحفظ...</span>
              </div>
            ) : (
              <>
                <span className="text-lg ml-2">{operation ? '💾' : '➕'}</span>
                {operation ? 'تحديث العملية' : 'حفظ العملية'}
              </>
            )}
          </button>
        </div>

        {/* معلومات مساعدة */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-500 text-2xl">💡</span>
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-2">نصائح مهمة:</p>
              <ul className="space-y-1 text-blue-700">
                {canViewPrices ? (
                  <>
                    <li>• أدخل وصف واضح ومفصل للعملية</li>
                    <li>• تأكد من دقة المبلغ المدخل</li>
                    <li>• استخدم "أخرى" لإضافة نوع عملية جديد</li>
                  </>
                ) : (
                  <>
                    <li>• أدخل وصف واضح ومفصل للعملية</li>
                    <li>• اختر نوع العملية المناسب</li>
                    <li>• المبلغ سيُحسب تلقائياً من قبل النظام</li>
                  </>
                )}
                <li>• استخدم الملاحظات لأي تفاصيل إضافية مهمة</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OperationForm;