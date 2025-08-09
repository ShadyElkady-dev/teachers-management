import React, { useState, useEffect } from 'react';
import { validatePhoneNumber } from '../../utils/helpers'; // استيراد الدالة

const TeacherForm = ({ teacher, onSave, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        backupPhone: '',
    });
    
    // حالة جديدة لتخزين الأخطاء
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (teacher) {
            setFormData({
                name: teacher.name || '',
                phone: teacher.phone || '',
                backupPhone: teacher.backupPhone || '',
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                backupPhone: '',
            });
        }
    }, [teacher]);

    // دالة للتحقق من صحة الحقول
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'اسم المدرس مطلوب';
        }
        
        // جعل رقم الهاتف الرئيسي إجباريًا
        if (!formData.phone.trim()) {
            newErrors.phone = 'رقم الهاتف مطلوب';
        } else if (!validatePhoneNumber(formData.phone)) {
            newErrors.phone = 'يجب إدخال رقم هاتف مصري صحيح (11 رقمًا يبدأ بـ 010, 011, 012, أو 015)';
        }

        // الرقم الاحتياطي اختياري، ولكن إذا تم إدخاله يجب أن يكون صحيحًا
        if (formData.backupPhone && !validatePhoneNumber(formData.backupPhone)) {
            newErrors.backupPhone = 'رقم الهاتف الاحتياطي غير صحيح';
        }
        setErrors(newErrors);
        // ترجع true إذا لم تكن هناك أخطاء
        return Object.keys(newErrors).length === 0;
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // منع إدخال أي شيء غير الأرقام في حقول الهاتف
        if (name === 'phone' || name === 'backupPhone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // إزالة الخطأ عند تعديل الحقل
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // التحقق من صحة البيانات قبل الحفظ
        if (validateForm()) {
            onSave(formData);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="label font-semibold text-gray-700">اسم المدرس <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input mt-2 text-right ${errors.name ? 'border-red-500' : ''}`}
                    required
                    placeholder="الاسم الكامل للمدرس"
                    dir="auto"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
                <label htmlFor="phone" className="label font-semibold text-gray-700">رقم الهاتف <span className="text-red-500">*</span></label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input mt-2 placeholder:text-right ${errors.phone ? 'border-red-500' : ''}`}
                    required
                    placeholder="01xxxxxxxxx"
                    maxLength="11"
                    dir="ltr"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
                <label htmlFor="backupPhone" className="label font-semibold text-gray-700">رقم الهاتف الاحتياطي (اختياري)</label>
                <input
                    type="tel"
                    id="backupPhone"
                    name="backupPhone"
                    value={formData.backupPhone}
                    onChange={handleChange}
                    className={`input mt-2 placeholder:text-right ${errors.backupPhone ? 'border-red-500' : ''}`}
                    placeholder="01xxxxxxxxx"
                    maxLength="11"
                    dir="ltr"
                />
                {errors.backupPhone && <p className="text-red-500 text-sm mt-1">{errors.backupPhone}</p>}
            </div>
            
            {/* تم حذف حقل الملاحظات من هنا */}

            <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
                    إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'جاري الحفظ...' : (teacher ? 'حفظ التعديلات' : 'إضافة المدرس')}
                </button>
            </div>
        </form>
    );
};

export default TeacherForm;