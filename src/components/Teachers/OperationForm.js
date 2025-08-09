import React, { useState, useEffect } from 'react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { dateToInputValue, sanitizeText } from '../../utils/helpers';
import { OPERATION_TYPES } from '../../utils/constants';
import LoadingSpinner from '../Common/LoadingSpinner';

const OperationForm = ({ 
  operation = null, 
  teacher = null,
  teachers = [], // قائمة المدرسين
  onSave, 
  onCancel, 
  loading = false 
}) => {
  const { hasPermission } = useAuth();
  const canViewPrices = hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES);

  // حالة النموذج
  const [formData, setFormData] = useState({
    teacherId: teacher?.id || '', // إضافة teacherId
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
        teacherId: operation.teacherId || teacher?.id || '',
        type: operation.type || 'printing',
        customType: OPERATION_TYPES.find(t => t.value === operation.type) ? '' : operation.type,
        description: operation.description || '',
        amount: operation.amount?.toString() || '',
        operationDate: dateToInputValue(operation.operationDate),
        notes: operation.notes || ''
      });
    } else {
      // إعادة تعيين النموذج مع المدرس المحدد
      setFormData({
        teacherId: teacher?.id || '',
        type: 'printing',
        customType: '',
        description: '',
        amount: '',
        operationDate: dateToInputValue(new Date()),
        notes: ''
      });
    }
  }, [operation, teacher]);

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};

    if (!formData.teacherId) {
      newErrors.teacherId = 'اختيار المدرس مطلوب';
    }
    if (!formData.type) {
      newErrors.type = 'نوع العملية مطلوب';
    }
    if (formData.type === 'other' && !formData.customType.trim()) {
      newErrors.customType = 'يرجى تحديد نوع العملية';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'وصف العملية مطلوب';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'وصف العملية يجب أن يكون أكثر من 3 أحرف';
    }
    if (canViewPrices) {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
      } else if (parseFloat(formData.amount) > 999999) {
        newErrors.amount = 'المبلغ كبير جداً';
      }
    }
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

  // معالجة تغيير القيم (تم التعديل هنا)
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // الأرقام فقط للمبلغ
    if (name === 'amount') {
        setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9.]/g, '') }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // معالجة التركيز على الحقل (تم التعديل هنا)
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // تنظيف النص عند الخروج من الحقل فقط
    if (name === 'description' || name === 'notes' || name === 'customType') {
        setFormData(prev => ({
            ...prev,
            [name]: sanitizeText(prev[name])
        }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const allTouched = Object.keys(formData).reduce((acc, key) => ({...acc, [key]: true}), {});
    setTouched(allTouched);

    if (validateForm()) {
        const teacherIdToSave = formData.teacherId || teacher?.id;
        if (!teacherIdToSave) {
            setErrors({ teacherId: 'يجب اختيار مدرس' });
            return;
        }

        const dataToSave = {
            type: formData.type === 'other' ? formData.customType.trim() : formData.type,
            description: formData.description.trim(),
            operationDate: new Date(formData.operationDate),
            notes: formData.notes.trim(),
            quantity: 1
        };

        if (canViewPrices) {
            dataToSave.amount = parseFloat(formData.amount);
            dataToSave.unitPrice = parseFloat(formData.amount);
        } else {
            dataToSave.amount = 1;
            dataToSave.unitPrice = 1;
        }

        onSave(teacherIdToSave, dataToSave);
    }
  };

  const hasError = (field) => touched[field] && errors[field];
  const selectedOperationType = OPERATION_TYPES.find(type => type.value === formData.type);
  const selectedTeacher = teacher || teachers.find(t => t.id === formData.teacherId);

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {!teacher && (
          <div>
            <label htmlFor="teacherId" className="block text-sm font-semibold text-gray-800 mb-2">
              اختيار المدرس <span className="text-red-500">*</span>
            </label>
            <select
              id="teacherId"
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-200 ${
                hasError('teacherId') 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
              disabled={loading}
            >
              <option value="">اختر المدرس</option>
              {teachers?.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} - {t.phone}
                </option>
              ))}
            </select>
            {hasError('teacherId') && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.teacherId}
              </p>
            )}
          </div>
        )}

        {selectedTeacher && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{selectedTeacher.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">{selectedTeacher.name}</h3>
                <p className="text-blue-700 font-medium">📞 {selectedTeacher.phone}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="type" className="block text-sm font-semibold text-gray-800 mb-2">
            نوع العملية <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            onBlur={handleBlur}
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

        {formData.type === 'other' && (
          <div>
            <label htmlFor="customType" className="block text-sm font-semibold text-gray-800 mb-2">
              نوع العملية المخصص <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customType"
              name="customType"
              value={formData.customType}
              onChange={handleChange}
              onBlur={handleBlur}
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

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
            وصف العملية <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
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
              type="text"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-3 border-2 rounded-xl text-base font-bold bg-white transition-all duration-200 ${
                hasError('amount') 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100'
              }`}
              placeholder="0.00"
              disabled={loading}
            />
            {hasError('amount') && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.amount}
              </p>
            )}
          </div>
        </PermissionGate>

        <div>
          <label htmlFor="operationDate" className="block text-sm font-semibold text-gray-800 mb-2">
            تاريخ العملية <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="operationDate"
            name="operationDate"
            value={formData.operationDate}
            onChange={handleChange}
            onBlur={handleBlur}
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

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-800 mb-2">
            ملاحظات
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
            placeholder="أي ملاحظات إضافية حول العملية"
            disabled={loading}
            rows="3"
          />
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
      </form>
    </div>
  );
};

export default OperationForm;