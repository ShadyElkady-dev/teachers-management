import React, { useState, useEffect } from 'react';

const TeacherForm = ({ teacher, onSave, onCancel, loading }) => {
    // تم تحديث الحالة لتشمل الحقول الجديدة فقط
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        backupPhone: '', // حقل جديد: رقم الهاتف الاحتياطي
        notes: '',       // حقل جديد: ملاحظات
    });

    useEffect(() => {
        if (teacher) {
            // تحميل بيانات المدرس عند التعديل
            setFormData({
                name: teacher.name || '',
                phone: teacher.phone || '',
                backupPhone: teacher.backupPhone || '',
                notes: teacher.notes || '',
            });
        } else {
            // إعادة تعيين النموذج عند إضافة مدرس جديد
            setFormData({
                name: '',
                phone: '',
                backupPhone: '',
                notes: '',
            });
        }
    }, [teacher]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    // هذه الدالة تضمن أن زر المسافة يعمل بشكل صحيح
    const handleKeyDown = (e) => {
        if (e.key === ' ') {
            e.stopPropagation();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="label">اسم المدرس</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown} // لمنع مشكلة المسافة
                    className="input"
                    required
                    placeholder="الاسم الكامل للمدرس"
                />
            </div>
            <div>
                <label htmlFor="phone" className="label">رقم الهاتف</label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="رقم الهاتف الأساسي"
                />
            </div>
            <div>
                <label htmlFor="backupPhone" className="label">رقم الهاتف الاحتياطي (اختياري)</label>
                <input
                    type="tel"
                    id="backupPhone"
                    name="backupPhone"
                    value={formData.backupPhone}
                    onChange={handleChange}
                    className="input"
                    placeholder="رقم هاتف إضافي للتواصل"
                />
            </div>
            <div>
                <label htmlFor="notes" className="label">ملاحظات (اختياري)</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown} // لمنع مشكلة المسافة
                    className="input"
                    rows="4"
                    placeholder="أي معلومات إضافية عن المدرس..."
                ></textarea>
            </div>
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