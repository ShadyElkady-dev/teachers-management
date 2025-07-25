import React, { useState, useEffect } from 'react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { dateToInputValue, sanitizeText } from '../../utils/helpers';
import { OPERATION_TYPES, PAPER_SIZES, PRINT_TYPES } from '../../utils/constants';
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
    description: '',
    quantity: 1,
    paperSize: 'A4',
    printType: 'black_white',
    unitPrice: 0.5,
    amount: 0,
    operationDate: dateToInputValue(new Date()),
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [calculationMode, setCalculationMode] = useState('manual'); // manual, auto

  // تعبئة النموذج عند التعديل
  useEffect(() => {
    if (operation) {
      setFormData({
        type: operation.type || 'printing',
        description: operation.description || '',
        quantity: operation.quantity || 1,
        paperSize: operation.paperSize || 'A4',
        printType: operation.printType || 'black_white',
        unitPrice: operation.unitPrice || 0.5,
        amount: operation.amount || 0,
        operationDate: dateToInputValue(operation.operationDate),
        notes: operation.notes || ''
      });
    }
  }, [operation]);

  // حساب المبلغ تلقائياً
  useEffect(() => {
    if (calculationMode === 'auto' && formData.type === 'printing') {
      const paperSize = PAPER_SIZES.find(size => size.value === formData.paperSize);
      const printType = PRINT_TYPES.find(type => type.value === formData.printType);
      
      if (paperSize && printType) {
        const calculatedPrice = paperSize.price * printType.multiplier;
        const calculatedAmount = calculatedPrice * formData.quantity;
        
        setFormData(prev => ({
          ...prev,
          unitPrice: calculatedPrice,
          amount: calculatedAmount
        }));
      }
    } else if (calculationMode === 'manual') {
      const calculatedAmount = formData.unitPrice * formData.quantity;
      setFormData(prev => ({
        ...prev,
        amount: calculatedAmount
      }));
    }
  }, [formData.quantity, formData.paperSize, formData.printType, formData.unitPrice, calculationMode, formData.type]);

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};

    // نوع العملية
    if (!formData.type) {
      newErrors.type = 'نوع العملية مطلوب';
    }

    // وصف العملية
    if (!formData.description.trim()) {
      newErrors.description = 'وصف العملية مطلوب';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'وصف العملية يجب أن يكون أكثر من 3 أحرف';
    }

    // الكمية
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر';
    } else if (formData.quantity > 10000) {
      newErrors.quantity = 'الكمية كبيرة جداً';
    }

    // السعر (فقط للأدمن)
    if (canViewPrices) {
      if (!formData.unitPrice || formData.unitPrice <= 0) {
        newErrors.unitPrice = 'السعر يجب أن يكون أكبر من صفر';
      } else if (formData.unitPrice > 1000) {
        newErrors.unitPrice = 'السعر كبير جداً';
      }

      // المبلغ الإجمالي
      if (!formData.amount || formData.amount <= 0) {
        newErrors.amount = 'المبلغ الإجمالي يجب أن يكون أكبر من صفر';
      }
    } else {
      // للسكرتارية: تعيين أسعار افتراضية إذا لم تكن موجودة
      if (!formData.unitPrice || formData.unitPrice <= 0) {
        setFormData(prev => ({
          ...prev,
          unitPrice: 0.5,
          amount: 0.5 * formData.quantity
        }));
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
    
    if (field === 'description' || field === 'notes') {
      processedValue = sanitizeText(value);
    } else if (field === 'quantity' || field === 'unitPrice' || field === 'amount') {
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
      // إرسال البيانات مع إخفاء الأسعار عن السكرتارية في الرد
      const dataToSave = {
        ...formData,
        operationDate: new Date(formData.operationDate)
      };

      // للسكرتارية: التأكد من وجود سعر افتراضي
      if (!canViewPrices) {
        if (!dataToSave.unitPrice || dataToSave.unitPrice <= 0) {
          dataToSave.unitPrice = 0.5; // سعر افتراضي
        }
        if (!dataToSave.amount || dataToSave.amount <= 0) {
          dataToSave.amount = dataToSave.unitPrice * dataToSave.quantity;
        }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* معلومات المدرس */}
      {teacher && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{teacher.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">{teacher.name}</h3>
              <p className="text-sm text-blue-700">{teacher.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* نوع العملية */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          نوع العملية <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          onBlur={() => handleBlur('type')}
          className={`input ${hasError('type') ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={loading}
        >
          {OPERATION_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {hasError('type') && (
          <p className="mt-1 text-sm text-red-600">{errors.type}</p>
        )}
      </div>

      {/* وصف العملية */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          وصف العملية <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          className={`input min-h-[80px] resize-y ${hasError('description') ? 'border-red-500 focus:border-red-500' : ''}`}
          placeholder="مثال: طباعة 100 ورقة A4 أبيض وأسود"
          disabled={loading}
          rows="3"
        />
        {hasError('description') && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* تفاصيل الطباعة (في حالة الطباعة) - مع إخفاء الأسعار للسكرتارية */}
      {formData.type === 'printing' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900 mb-3">تفاصيل الطباعة</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* حجم الورق */}
            <div>
              <label htmlFor="paperSize" className="block text-sm font-medium text-gray-700 mb-1">
                حجم الورق
              </label>
              <select
                id="paperSize"
                value={formData.paperSize}
                onChange={(e) => handleChange('paperSize', e.target.value)}
                className="input"
                disabled={loading}
              >
                {PAPER_SIZES.map(size => (
                  <option key={size.value} value={size.value}>
                    {canViewPrices ? `${size.label} - ${size.price} جنيه` : size.label}
                  </option>
                ))}
              </select>
            </div>

            {/* نوع الطباعة */}
            <div>
              <label htmlFor="printType" className="block text-sm font-medium text-gray-700 mb-1">
                نوع الطباعة
              </label>
              <select
                id="printType"
                value={formData.printType}
                onChange={(e) => handleChange('printType', e.target.value)}
                className="input"
                disabled={loading}
              >
                {PRINT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} {canViewPrices ? `(×${type.multiplier})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* طريقة الحساب - فقط للأدمن */}
          <PermissionGate permission={PERMISSIONS.VIEW_OPERATION_PRICES}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة حساب السعر
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="calculationMode"
                    value="auto"
                    checked={calculationMode === 'auto'}
                    onChange={(e) => setCalculationMode(e.target.value)}
                    className="text-blue-500"
                  />
                  <span className="text-sm">حساب تلقائي</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="calculationMode"
                    value="manual"
                    checked={calculationMode === 'manual'}
                    onChange={(e) => setCalculationMode(e.target.value)}
                    className="text-blue-500"
                  />
                  <span className="text-sm">حساب يدوي</span>
                </label>
              </div>
            </div>
          </PermissionGate>
        </div>
      )}

      {/* الكمية والسعر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* الكمية */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            الكمية <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            onBlur={() => handleBlur('quantity')}
            className={`input ${hasError('quantity') ? 'border-red-500 focus:border-red-500' : ''}`}
            placeholder="1"
            min="1"
            max="10000"
            disabled={loading}
          />
          {hasError('quantity') && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>

        {/* سعر الوحدة - فقط للأدمن */}
        <PermissionGate 
          permission={PERMISSIONS.VIEW_OPERATION_PRICES}
          fallback={
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سعر الوحدة
              </label>
              <div className="input bg-gray-100 flex items-center justify-center text-gray-500">
                مخفي
              </div>
            </div>
          }
        >
          <div>
            <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-2">
              سعر الوحدة (جنيه) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="unitPrice"
              value={formData.unitPrice}
              onChange={(e) => handleChange('unitPrice', e.target.value)}
              onBlur={() => handleBlur('unitPrice')}
              className={`input ${hasError('unitPrice') ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="0.50"
              min="0"
              step="0.01"
              disabled={loading || (calculationMode === 'auto' && formData.type === 'printing')}
            />
            {hasError('unitPrice') && (
              <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
            )}
          </div>
        </PermissionGate>

        {/* المبلغ الإجمالي - فقط للأدمن */}
        <PermissionGate 
          permission={PERMISSIONS.VIEW_OPERATION_PRICES}
          fallback={
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المبلغ الإجمالي
              </label>
              <div className="input bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                مخفي
              </div>
            </div>
          }
        >
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ الإجمالي (جنيه) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              onBlur={() => handleBlur('amount')}
              className={`input ${hasError('amount') ? 'border-red-500 focus:border-red-500' : ''} font-bold text-lg`}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={loading}
              readOnly={calculationMode === 'auto' || calculationMode === 'manual'}
            />
            {hasError('amount') && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>
        </PermissionGate>
      </div>

      {/* تاريخ العملية */}
      <div>
        <label htmlFor="operationDate" className="block text-sm font-medium text-gray-700 mb-2">
          تاريخ العملية <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="operationDate"
          value={formData.operationDate}
          onChange={(e) => handleChange('operationDate', e.target.value)}
          onBlur={() => handleBlur('operationDate')}
          className={`input ${hasError('operationDate') ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={loading}
        />
        {hasError('operationDate') && (
          <p className="mt-1 text-sm text-red-600">{errors.operationDate}</p>
        )}
      </div>

      {/* ملاحظات */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          ملاحظات
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          onBlur={() => handleBlur('notes')}
          className="input min-h-[80px] resize-y"
          placeholder="أي ملاحظات إضافية حول العملية"
          disabled={loading}
          rows="3"
        />
      </div>

      {/* ملخص العملية - مع مراعاة الصلاحيات */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-3">ملخص العملية</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-700">النوع:</span>
            <span className="font-medium mr-2">{selectedOperationType?.label}</span>
          </div>
          <div>
            <span className="text-green-700">الكمية:</span>
            <span className="font-medium mr-2">{formData.quantity}</span>
          </div>
          
          {/* إظهار الأسعار فقط للأدمن */}
          <PermissionGate permission={PERMISSIONS.VIEW_OPERATION_PRICES}>
            <div>
              <span className="text-green-700">سعر الوحدة:</span>
              <span className="font-medium mr-2">{formData.unitPrice.toFixed(2)} جنيه</span>
            </div>
            <div>
              <span className="text-green-700">المبلغ الإجمالي:</span>
              <span className="font-bold text-lg mr-2 text-green-900">{formData.amount.toFixed(2)} جنيه</span>
            </div>
          </PermissionGate>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 btn btn-secondary"
        >
          إلغاء
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn btn-primary"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <LoadingSpinner size="small" color="white" />
              {operation ? 'جاري التحديث...' : 'جاري الحفظ...'}
            </div>
          ) : (
            operation ? 'تحديث العملية' : 'حفظ العملية'
          )}
        </button>
      </div>

      {/* معلومات مساعدة - مخصصة للسكرتارية */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-lg">💡</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">نصائح:</p>
            <ul className="space-y-1 text-blue-700">
              {canViewPrices ? (
                <>
                  <li>• استخدم الحساب التلقائي للطباعة للحصول على أسعار دقيقة</li>
                  <li>• تأكد من إدخال وصف واضح ومفصل للعملية</li>
                  <li>• يمكنك تعديل المبلغ الإجمالي يدوياً إذا احتجت لذلك</li>
                </>
              ) : (
                <>
                  <li>• تأكد من إدخال وصف واضح ومفصل للعملية</li>
                  <li>• اختر نوع الطباعة وحجم الورق المناسب</li>
                  <li>• الأسعار ستُحسب تلقائياً من قبل النظام</li>
                </>
              )}
              <li>• استخدم الملاحظات لأي تفاصيل إضافية مهمة</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
};

export default OperationForm;