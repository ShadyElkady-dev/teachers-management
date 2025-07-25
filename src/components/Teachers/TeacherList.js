import React from 'react';

const TeacherList = ({ teachers, onViewDetails, onEdit, onDelete }) => {
    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
                <thead className="bg-gray-100 border-b">
                    <tr>
                        <th className="py-3 px-6 text-right font-semibold text-gray-700">اسم المدرس</th>
                        <th className="py-3 px-6 text-center font-semibold text-gray-700 w-1/3">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {teachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="py-4 px-6">
                                <div className="font-medium text-gray-800">{teacher.name}</div>
                                <div className="text-sm text-gray-500">{teacher.phone}</div>
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                    {/* عرض التفاصيل */}
                                    <button
                                        onClick={() => onViewDetails(teacher)}
                                        className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white rounded-md shadow transition duration-200"
                                        style={{ backgroundColor: '#3B82F6' }}
                                    >
                                        📄 عرض التفاصيل
                                    </button>

                                    {/* تعديل */}
                                    <button
                                        onClick={() => onEdit(teacher)}
                                        className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white rounded-md shadow transition duration-200"
                                        style={{ backgroundColor: 'rgba(53, 0, 255, 0.71)' }}
                                    >
                                        ✏️ تعديل
                                    </button>

                                    {/* حذف */}
                                    <button
                                        onClick={() => onDelete(teacher)}
                                        className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow transition duration-200"
                                    >
                                        🗑️ حذف
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherList;
