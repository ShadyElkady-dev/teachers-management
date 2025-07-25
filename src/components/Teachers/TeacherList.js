import React from 'react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';

const TeacherList = ({ teachers, onViewDetails, onEdit, onDelete, onAddOperation }) => {
    return (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border-2 border-gray-100">
            <table className="min-w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                        <th className="py-4 px-6 text-right font-bold text-gray-700 text-sm">اسم المدرس</th>
                        <th className="py-4 px-6 text-center font-bold text-gray-700 text-sm">معلومات التواصل</th>
                        <th className="py-4 px-6 text-center font-bold text-gray-700 text-sm">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {teachers.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="text-6xl mb-4">👨‍🏫</div>
                                    <div className="font-bold text-xl text-gray-700 mb-2">لا يوجد مدرسين</div>
                                    <div className="text-gray-500">لم يتم إضافة أي مدرسين بعد</div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        teachers.map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="py-4 px-6">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ml-4 shadow-lg">
                                            <span className="text-white font-bold text-lg">
                                                {teacher.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{teacher.name}</div>
                                            {teacher.school && (
                                                <div className="text-sm text-gray-600">🏫 {teacher.school}</div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="py-4 px-6 text-center">
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-gray-900">📞 {teacher.phone}</div>
                                        {teacher.backupPhone && (
                                            <div className="text-xs text-gray-600">📱 {teacher.backupPhone}</div>
                                        )}
                                        {teacher.email && (
                                            <div className="text-xs text-gray-600">📧 {teacher.email}</div>
                                        )}
                                    </div>
                                </td>
                                
                                <td className="py-4 px-6">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {/* عرض التفاصيل */}
                                        <button
                                            onClick={() => onViewDetails(teacher)}
                                            className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                            title="عرض التفاصيل"
                                        >
                                            <span className="text-lg ml-1">📄</span>
                                            عرض التفاصيل
                                        </button>

                                        {/* إضافة عملية */}
                                        <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
                                            <button
                                                onClick={() => onAddOperation(teacher)}
                                                className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                                title="إضافة عملية"
                                            >
                                                <span className="text-lg ml-1">➕</span>
                                                إضافة عملية
                                            </button>
                                        </PermissionGate>

                                        {/* تعديل */}
                                        <PermissionGate permission={PERMISSIONS.EDIT_TEACHER}>
                                            <button
                                                onClick={() => onEdit(teacher)}
                                                className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                                title="تعديل البيانات"
                                            >
                                                <span className="text-lg ml-1">✏️</span>
                                                تعديل
                                            </button>
                                        </PermissionGate>

                                        {/* حذف */}
                                        <PermissionGate permission={PERMISSIONS.DELETE_TEACHER}>
                                            <button
                                                onClick={() => onDelete(teacher)}
                                                className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                                title="حذف المدرس"
                                            >
                                                <span className="text-lg ml-1">🗑️</span>
                                                حذف
                                            </button>
                                        </PermissionGate>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherList;