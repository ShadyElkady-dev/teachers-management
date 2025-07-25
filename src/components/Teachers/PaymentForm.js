import React, { useState, useEffect } from 'react';
import { PAYMENT_METHODS } from '../../utils/constants';

const PaymentForm = ({ payment, onSave, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        amount: '',
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'Cash',
        notes: ''
    });

    useEffect(() => {
        if (payment) {
            setFormData({
                amount: payment.amount || '',
                paymentDate: payment.paymentDate ? new Date(payment.paymentDate.seconds * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                paymentMethod: payment.paymentMethod || 'Cash',
                notes: payment.notes || ''
            });
        }
    }, [payment]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            amount: parseFloat(formData.amount)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="amount" className="label">المبلغ</label>
                <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="input"
                    required
                />
            </div>
            <div>
                <label htmlFor="paymentDate" className="label">تاريخ الدفعة</label>
                <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    className="input"
                    required
                />
            </div>
            <div>
                <label htmlFor="paymentMethod" className="label">طريقة الدفع</label>
                <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="input"
                >
                    {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="notes" className="label">ملاحظات</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="input"
                    rows="3"
                ></textarea>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
                    إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'جاري الحفظ...' : 'حفظ الدفعة'}
                </button>
            </div>
        </form>
    );
};

export default PaymentForm;