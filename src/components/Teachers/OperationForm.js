import React, { useState, useEffect } from 'react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { OPERATION_TYPES } from '../../utils/constants';
import LoadingSpinner from '../Common/LoadingSpinner';
import { dateToInputValue, sanitizeText, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

// دالة مساعدة لتحويل الوقت إلى تنسيق input time (محسنة)
const timeToInputValue = (date) => {
  if (!date) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error in timeToInputValue:', error);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};

// ======== بداية كود الحاسبة الكامل =========
const PriceCalculator = ({ onCopyToAmount }) => {
    const [calcType, setCalcType] = useState('تصوير');
    const [sheets, setSheets] = useState('');
    const [sheetPrice, setSheetPrice] = useState('');
    const [bshrPrice, setBshrPrice] = useState('');
    const [copies, setCopies] = useState(1);
    const [copyPrice, setCopyPrice] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    const handleCalculate = () => {
        const numSheets = parseFloat(sheets) || 0;
        const numSheetPrice = parseFloat(sheetPrice) || 0;
        const numBshrPrice = parseFloat(bshrPrice) || 0;
        const numCopies = parseInt(copies, 10) || 1;

        if (numSheets === 0 || numSheetPrice === 0) {
            toast.error("يجب إدخال عدد الورق وسعر الورقة");
            return;
        }

        let calculatedCopyPrice = 0;
        if (calcType === 'بشر') {
            calculatedCopyPrice = (numSheets * numSheetPrice) + numBshrPrice;
        } else {
            calculatedCopyPrice = numSheets * numSheetPrice;
        }

        const calculatedTotalPrice = calculatedCopyPrice * numCopies;
        setCopyPrice(calculatedCopyPrice);
        setTotalPrice(calculatedTotalPrice);
    };
    
    const handleCopyClick = () => {
        if (totalPrice > 0) {
            onCopyToAmount(totalPrice.toString());
            toast.success(`تم نسخ المبلغ ${formatCurrency(totalPrice)}`);
        } else {
            toast.error("يرجى حساب السعر أولاً قبل النسخ");
        }
    };

    return (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 space-y-4 mb-6">
            <h4 className="font-bold text-gray-800 text-center text-lg">🧮 الحاسبة </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* العمود الأيمن: المدخلات */}
                <div className="space-y-3 p-4 bg-white border rounded-xl">
                    <div>
                        <label className="text-sm font-medium">نوع العملية</label>
                        <select value={calcType} onChange={(e) => setCalcType(e.target.value)} className="input mt-1">
                            <option value="تصوير">تصوير</option>
                            <option value="بشر">بشر</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium">عدد الورق</label>
                            <input type="number" placeholder="0" value={sheets} onChange={(e) => setSheets(e.target.value)} className="input mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">سعر الورقة</label>
                            <input type="number" placeholder="0.0" value={sheetPrice} onChange={(e) => setSheetPrice(e.target.value)} className="input mt-1" />
                        </div>
                    </div>
                    {calcType === 'بشر' && (
                        <div>
                            <label className="text-sm font-medium">سعر البشر</label>
                            <input type="number" placeholder="0.0" value={bshrPrice} onChange={(e) => setBshrPrice(e.target.value)} className="input mt-1" />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium">عدد النسخ</label>
                        <input type="number" placeholder="1" value={copies} onChange={(e) => setCopies(e.target.value)} className="input mt-1" />
                    </div>
                    <button type="button" onClick={handleCalculate} className="btn btn-primary w-full">احسب</button>
                </div>

                {/* العمود الأيسر: النتائج */}
                <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-xl flex flex-col justify-center">
                    <div className="text-center">
                        <label className="text-sm font-medium text-green-800">سعر النسخة</label>
                        <div className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(copyPrice)}</div>
                    </div>
                    <div className="text-center mt-4">
                        <label className="text-sm font-medium text-green-800">السعر الإجمالي</label>
                        <div className="text-3xl font-bold text-green-700 mt-1">{formatCurrency(totalPrice)}</div>
                    </div>
                    <button type="button" onClick={handleCopyClick} className="btn btn-success w-full mt-auto">
                        نسخ الإجمالي إلى مبلغ العملية
                    </button>
                </div>
            </div>
        </div>
    );
};
// ======== نهاية كود الحاسبة =========

const OperationForm = ({ 
  operation = null, 
  teacher = null,
  teachers = [], 
  onSave, 
  onCancel, 
  loading = false 
}) => {
  const { hasPermission } = useAuth();
  const canViewPrices = hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES);

  // حالة النموذج
  const [formData, setFormData] = useState({
    teacherId: teacher?.id || '', 
    type: 'printing',
    customType: '',
    description: '',
    amount: '',
    operationDate: dateToInputValue(new Date()),
    operationTime: timeToInputValue(new Date()), // إضافة حقل الوقت
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // تعبئة النموذج عند التعديل
  useEffect(() => {
    if (operation) {
      try {
        const operationDate = operation.operationDate ? new Date(operation.operationDate) : new Date();
        
        // التحقق من صحة التاريخ
        const validDate = isNaN(operationDate.getTime()) ? new Date() : operationDate;
        
        setFormData({
          teacherId: operation.teacherId || teacher?.id || '',
          type: operation.type || 'printing',
          customType: OPERATION_TYPES.find(t => t.value === operation.type) ? '' : operation.type,
          description: operation.description || '',
          amount: operation.amount?.toString() || '',
          operationDate: dateToInputValue(validDate),
          operationTime: timeToInputValue(validDate), // استخراج الوقت من التاريخ المحفوظ
          notes: operation.notes || ''
        });
      } catch (error) {
        console.error('Error processing operation data:', error);
        // استخدام البيانات الافتراضية في حالة الخطأ
        const now = new Date();
        setFormData({
          teacherId: operation.teacherId || teacher?.id || '',
          type: operation.type || 'printing',
          customType: OPERATION_TYPES.find(t => t.value === operation.type) ? '' : operation.type,
          description: operation.description || '',
          amount: operation.amount?.toString() || '',
          operationDate: dateToInputValue(now),
          operationTime: timeToInputValue(now),
          notes: operation.notes || ''
        });
      }
    } else {
      // إعادة تعيين النموذج مع المدرس المحدد والوقت الحالي
      const now = new Date();
      setFormData({
        teacherId: teacher?.id || '',
        type: 'printing',
        customType: '',
        description: '',
        amount: '',
        operationDate: dateToInputValue(now),
        operationTime: timeToInputValue(now), // الوقت الحالي
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
    if (!formData.operationTime) {
      newErrors.operationTime = 'وقت العملية مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // معالجة تغيير القيم
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

  // معالجة التركيز على الحقل
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

  const handleCalculatorResult = (result) => {
      setFormData(prev => ({ ...prev, amount: result }));
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

        // دمج التاريخ والوقت
        const [hours, minutes] = formData.operationTime.split(':');
        const finalOperationDate = new Date(formData.operationDate);
        finalOperationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const dataToSave = {
            type: formData.type === 'other' ? formData.customType.trim() : formData.type,
            description: formData.description.trim(),
            operationDate: finalOperationDate, // التاريخ مع الوقت المحدد
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

        {/* حقلي التاريخ والوقت */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label htmlFor="operationTime" className="block text-sm font-semibold text-gray-800 mb-2">
              وقت العملية <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="operationTime"
              name="operationTime"
              value={formData.operationTime}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium bg-white transition-all duration-200 ${
                hasError('operationTime') 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
              disabled={loading}
            />
            {hasError('operationTime') && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.operationTime}
              </p>
            )}
          </div>
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

        <PermissionGate permission={PERMISSIONS.VIEW_OPERATION_PRICES}>
          <PriceCalculator onCopyToAmount={handleCalculatorResult} />
        </PermissionGate>

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