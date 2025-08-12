import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { formatCurrency, formatDate, timeAgo, isSmallScreen } from '../../utils/helpers';
import { OPERATION_TYPES, PAYMENT_METHODS } from '../../utils/constants';
import LoadingSpinner from '../Common/LoadingSpinner';
import ConfirmationModal from '../Common/ConfirmationModal';

const TeacherDetails = ({
    teacher,
    onAddOperation,
    onEditOperation,
    onDeleteOperation,
    onAddPayment,
    onEditPayment,
    onDeletePayment,
}) => {
    const { state, operationsService, paymentsService, calculateTeacherDebt } = useAppContext();
    const { hasPermission, isSecretary } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [operations, setOperations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, item: null, type: '' });
    const [isMobile, setIsMobile] = useState(isSmallScreen());

    useEffect(() => {
        const handleResize = () => setIsMobile(isSmallScreen());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const canViewPrices = hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES);
    const canViewPricesAfterSave = hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES_AFTER_SAVE);
    const canViewAllOperations = hasPermission(PERMISSIONS.VIEW_ALL_OPERATIONS);
    const canEditOperations = hasPermission(PERMISSIONS.EDIT_OPERATION);
    const canDeleteOperations = hasPermission(PERMISSIONS.DELETE_OPERATION);

    useEffect(() => {
        if (!teacher) return;
        setLoading(true);
        const unsubscribeOps = operationsService.subscribeToTeacherOperations(teacher.id, (snapshot) => {
            let operationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // 🔥 تحديد العمليات للسكرتيرة - آخر 1 عمليات فقط
            if (isSecretary()) {
                operationsData = operationsData
                    .sort((a, b) => b.operationDate?.toDate() - a.operationDate?.toDate())
                    .slice(0, 1); // آخر 1 عمليات فقط
            }
            
            setOperations(operationsData);
        });
        const unsubscribePayments = paymentsService.subscribeToTeacherPayments(teacher.id, (snapshot) => {
            setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => {
            unsubscribeOps();
            unsubscribePayments();
        };
    }, [teacher, operationsService, paymentsService, isSecretary]);

    const openConfirmModal = (item, type) => {
        setConfirmModalState({ isOpen: true, item, type });
    };

    const closeConfirmModal = () => {
        setConfirmModalState({ isOpen: false, item: null, type: '' });
    };

    const handleConfirmDelete = async () => {
        const { item, type } = confirmModalState;
        if (!item) return;

        if (type === 'operation') {
            await onDeleteOperation(item);
        } else if (type === 'payment') {
            await onDeletePayment(item);
        }
        closeConfirmModal();
    };

    if (!teacher) return <div className="text-center py-8 text-gray-500">لم يتم اختيار مدرس</div>;
    if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="large" /></div>;

    const debt = calculateTeacherDebt(teacher.id);

    const renderEmptyState = (title, description, onAdd) => (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
            <p className="text-gray-500 mt-1">{description}</p>
            {onAdd && (
                 <button onClick={onAdd} className="btn btn-primary mt-4">
                    <span className="text-lg">➕</span> إضافة الآن
                 </button>
            )}
        </div>
    );
    
    const renderOverview = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">{teacher.name.charAt(0)}</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-blue-900">{teacher.name}</h2>
                        <p className="text-blue-700">📞 {teacher.phone}</p>
                        {teacher.school && <p className="text-blue-600">🏫 {teacher.school}</p>}
                        {teacher.email && <p className="text-blue-600">📧 {teacher.email}</p>}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 🔥 إخفاء الرصيد عن السكرتيرة */}
                <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                    <div className={`p-6 rounded-lg border-2 ${
                        debt > 0 ? 'bg-red-50 border-red-200' :
                        debt === 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                        <div className="text-center">
                            <div className="text-2xl mb-2">{debt > 0 ? '⚠️' : debt === 0 ? '✅' : '💰'}</div>
                            <div className={`text-2xl font-bold ${
                                debt > 0 ? 'text-red-600' :
                                debt === 0 ? 'text-green-600' : 'text-blue-600'
                            }`}>{formatCurrency(Math.abs(debt))}</div>
                            <div className="text-sm text-gray-600">{debt > 0 ? 'مديونية' : debt === 0 ? 'مسدد' : 'دفع زائد'}</div>
                        </div>
                    </div>
                </PermissionGate>

                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <div className="text-center">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {/* 🔥 إخفاء إجمالي المبالغ عن السكرتيرة */}
                            {canViewPricesAfterSave ? formatCurrency(operations.reduce((sum, op) => sum + (op.amount || 0), 0)) : '---'}
                        </div>
                        <div className="text-sm text-gray-600">
                            {/* 🔥 للسكرتيرة: إظهار عدد العمليات مع تنبيه */}
                            {isSecretary() ? `آخر ${operations.length} عمليات` : `إجمالي العمليات (${operations.length})`}
                        </div>
                    </div>
                </div>

                <PermissionGate permission={PERMISSIONS.VIEW_PAYMENTS}>
                    <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                        <div className="text-center">
                            <div className="text-2xl mb-2">💳</div>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}</div>
                            <div className="text-sm text-gray-600">إجمالي المدفوعات ({payments.length})</div>
                        </div>
                    </div>
                </PermissionGate>
            </div>
        </div>
    );

    const renderOperations = () => {
        if (operations.length === 0) {
            return renderEmptyState(
                'لا توجد عمليات', 
                isSecretary() ? 'لم تقم بتسجيل أي عمليات لهذا المدرس بعد.' : 'لم يتم تسجيل أي عمليات لهذا المدرس بعد.',
                hasPermission(PERMISSIONS.ADD_OPERATION) ? () => onAddOperation(teacher) : null
            );
        }

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        {/* 🔥 تخصيص العنوان للسكرتيرة */}
                        {isSecretary() ? `آخر ${operations.length} عملية قمت بتسجيلها` : `العمليات (${operations.length})`}
                    </h3>
                    <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
                        <button onClick={() => onAddOperation(teacher)} className="btn btn-primary">
                            <span className="text-lg">➕</span> إضافة عملية جديدة
                        </button>
                    </PermissionGate>
                </div>

                

                {isMobile ? (
                    <div className="space-y-3">
                        {operations.map(op => {
                            const opType = OPERATION_TYPES.find(t => t.value === op.type);
                            return (
                                <div key={op.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-800">{opType?.label || op.type}</div>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap break-all mt-1" style={{ wordBreak: 'break-all' }}>{op.description}</p>
                                            <div className="text-xs text-gray-500 mt-2">{formatDate(op.operationDate)} • {timeAgo(op.operationDate)}</div>
                                        </div>
                                        {/* 🔥 إخفاء المبلغ عن السكرتيرة بعد الحفظ */}
                                        {canViewPricesAfterSave && (
                                            <div className="text-left ml-2 flex-shrink-0">
                                                <div className="font-bold text-blue-600">{formatCurrency(op.amount)}</div>
                                                <div className="text-xs text-gray-500">الكمية: {op.quantity || 1}</div>
                                            </div>
                                        )}
                                    </div>
                                    {/* 🔥 إخفاء أزرار التعديل والحذف عن السكرتيرة */}
                                    {(canEditOperations || canDeleteOperations) && (
                                        <div className="flex justify-end gap-3 mt-3 pt-3 border-t">
                                            <PermissionGate permission={PERMISSIONS.EDIT_OPERATION}>
                                                <button onClick={() => onEditOperation(op)} className="text-blue-600">✏️ تعديل</button>
                                            </PermissionGate>
                                            <PermissionGate permission={PERMISSIONS.DELETE_OPERATION}>
                                                <button onClick={() => openConfirmModal(op, 'operation')} className="text-red-600">🗑️ حذف</button>
                                            </PermissionGate>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-lg shadow table-auto">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-right font-semibold text-gray-700 w-40">التاريخ</th>
                                    <th className="py-3 px-4 text-right font-semibold text-gray-700">الوصف</th>
                                    <th className="py-3 px-4 text-center font-semibold text-gray-700 w-24">الكمية</th>
                                    {/* 🔥 إخفاء عمود المبلغ عن السكرتيرة */}
                                    {canViewPricesAfterSave && <th className="py-3 px-4 text-center font-semibold text-gray-700 w-36">المبلغ</th>}
                                    {/* 🔥 إخفاء عمود الإجراءات عن السكرتيرة */}
                                    {(canEditOperations || canDeleteOperations) && <th className="py-3 px-4 text-center font-semibold text-gray-700 w-32">إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {operations.map(op => (
                                    <tr key={op.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{formatDate(op.operationDate)}</td>
                                        <td className="py-3 px-4 whitespace-normal break-all">{op.description}</td>
                                        <td className="py-3 px-4 text-center">{op.quantity || 1}</td>
                                        {/* 🔥 إخفاء المبلغ عن السكرتيرة */}
                                        {canViewPricesAfterSave && <td className="py-3 px-4 font-mono text-center">{formatCurrency(op.amount)}</td>}
                                        {/* 🔥 إخفاء أزرار الإجراءات عن السكرتيرة */}
                                        {(canEditOperations || canDeleteOperations) && (
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <PermissionGate permission={PERMISSIONS.EDIT_OPERATION}>
                                                        <button onClick={() => onEditOperation(op)} className="text-blue-600 hover:text-blue-800">✏️</button>
                                                    </PermissionGate>
                                                    <PermissionGate permission={PERMISSIONS.DELETE_OPERATION}>
                                                        <button onClick={() => openConfirmModal(op, 'operation')} className="text-red-600 hover:text-red-800">🗑️</button>
                                                    </PermissionGate>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderPayments = () => {
         if (payments.length === 0) {
            return renderEmptyState(
                'لا توجد مدفوعات',
                'لم يتم تسجيل أي مدفوعات من هذا المدرس بعد.',
                hasPermission(PERMISSIONS.ADD_PAYMENT) ? () => onAddPayment(teacher) : null
            );
        }

        return (
            <PermissionGate permission={PERMISSIONS.VIEW_PAYMENTS} fallback={<div>غير مصرح لك</div>}>
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">المدفوعات ({payments.length})</h3>
                        <PermissionGate permission={PERMISSIONS.ADD_PAYMENT}>
                            <button onClick={() => onAddPayment(teacher)} className="btn btn-success"><span className="text-lg">💵</span> إضافة دفعة جديدة</button>
                        </PermissionGate>
                    </div>

                    {isMobile ? (
                        <div className="space-y-3">
                            {payments.map(p => {
                                const paymentMethod = PAYMENT_METHODS.find(m => m.value === p.paymentMethod);
                                return (
                                <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-800">{paymentMethod?.label || p.paymentMethod}</div>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap break-all mt-1">{p.notes || 'لا توجد ملاحظات'}</p>
                                            <div className="text-xs text-gray-500 mt-2">{formatDate(p.paymentDate)} • {timeAgo(p.paymentDate)}</div>
                                        </div>
                                        <div className="text-left ml-2">
                                            <div className="font-bold text-green-600">{formatCurrency(p.amount)}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-3 pt-3 border-t">
                                        <PermissionGate permission={PERMISSIONS.EDIT_PAYMENT}><button onClick={() => onEditPayment(p)} className="text-blue-600">✏️ تعديل</button></PermissionGate>
                                        <PermissionGate permission={PERMISSIONS.DELETE_PAYMENT}><button onClick={() => openConfirmModal(p, 'payment')} className="text-red-600">🗑️ حذف</button></PermissionGate>
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full bg-white rounded-lg shadow table-auto">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="py-3 px-4 text-right font-semibold text-gray-700 w-40">تاريخ الدفعة</th>
                                        <th className="py-3 px-4 text-center font-semibold text-gray-700 w-36">المبلغ</th>
                                        <th className="py-3 px-4 text-right font-semibold text-gray-700 w-32">طريقة الدفع</th>
                                        <th className="py-3 px-4 text-right font-semibold text-gray-700">ملاحظات</th>
                                        <th className="py-3 px-4 text-center font-semibold text-gray-700 w-32">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(p => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">{formatDate(p.paymentDate)}</td>
                                            <td className="py-3 px-4 font-mono text-green-700 text-center">{formatCurrency(p.amount)}</td>
                                            <td className="py-3 px-4">{p.paymentMethod}</td>
                                            <td className="py-3 px-4 whitespace-normal break-all">{p.notes || '-'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <PermissionGate permission={PERMISSIONS.EDIT_PAYMENT}><button onClick={() => onEditPayment(p)} className="text-blue-600 hover:text-blue-800">✏️</button></PermissionGate>
                                                    <PermissionGate permission={PERMISSIONS.DELETE_PAYMENT}><button onClick={() => openConfirmModal(p, 'payment')} className="text-red-600 hover:text-red-800">🗑️</button></PermissionGate>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </PermissionGate>
        );
    };

    return (
        <div>
            <div className="flex border-b mb-4 overflow-x-auto">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>نظرة عامة</button>
                <button onClick={() => setActiveTab('operations')} className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'operations' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
                    {/* 🔥 تخصيص النص للسكرتيرة */}
                    {isSecretary() ? 'عملياتي الأخيرة' : 'العمليات'}
                </button>
                {/* 🔥 إخفاء تبويب المدفوعات عن السكرتيرة */}
                <PermissionGate permission={PERMISSIONS.VIEW_PAYMENTS}>
                    <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'payments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>المدفوعات</button>
                </PermissionGate>
            </div>
            <div className="pt-4">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'operations' && renderOperations()}
                {activeTab === 'payments' && renderPayments()}
            </div>
            <ConfirmationModal
                isOpen={confirmModalState.isOpen}
                onClose={closeConfirmModal}
                onConfirm={handleConfirmDelete}
                title={`تأكيد حذف ${confirmModalState.type === 'operation' ? 'العملية' : 'الدفعة'}`}
                message="هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
                loading={state.loading.operations || state.loading.payments}
            />
        </div>
    );
};

export default TeacherDetails;