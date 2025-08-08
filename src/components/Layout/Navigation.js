import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { formatCurrency } from '../../utils/helpers';

const Navigation = ({ onNavigate }) => {
  const location = useLocation();
  const { state, calculateTotalProfit, calculateTeacherDebt } = useAppContext();
  const { user, hasPermission } = useAuth();

  const mainSections = [
    {
      id: 'teachers',
      name: 'المدرسين',
      icon: '👨‍🏫',
      path: '/teachers',
      permission: PERMISSIONS.VIEW_TEACHERS,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      hoverBg: 'hover:bg-indigo-100'
    },
    {
      id: 'operations',
      name: 'العمليات',
      icon: '📝',
      path: '/operations',
      permission: PERMISSIONS.VIEW_OPERATIONS,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      hoverBg: 'hover:bg-green-100'
    },
    {
      id: 'accounts',
      name: 'الحسابات',
      icon: '💰',
      path: '/accounts',
      permission: PERMISSIONS.VIEW_PAYMENTS,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      hoverBg: 'hover:bg-purple-100'
    },
    {
      id: 'expenses',
      name: 'المصروفات',
      icon: '💸',
      path: '/expenses',
      permission: PERMISSIONS.VIEW_EXPENSES,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      hoverBg: 'hover:bg-red-100'
    },
    {
      id: 'reports',
      name: 'التقارير',
      icon: '📄',
      path: '/reports',
      permission: PERMISSIONS.VIEW_REPORTS,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-700',
      hoverBg: 'hover:bg-teal-100'
    }
  ];

  const availableSections = mainSections.filter(section => 
    !section.permission || hasPermission(section.permission)
  );

  return (
    <nav className="h-full bg-gradient-to-b from-gray-50 to-white">
      <div className="p-6">
        
        <div className="mb-6 relative overflow-hidden">
          <div className={`bg-gradient-to-r ${user?.role === 'admin' ? 'from-purple-500 to-indigo-600' : 'from-blue-500 to-cyan-600'} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                <span className="text-white font-bold text-2xl">
                  {user?.name?.charAt(0) || '👤'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-white mb-1">{user?.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{user?.role === 'admin' ? '👑' : '📝'}</span>
                  <p className="text-white opacity-90 font-medium">
                    {user?.role === 'admin' ? 'مدير النظام' : 'سكرتارية'}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            الأقسام الرئيسية
          </h3>
          
          <div className="space-y-2">
            {availableSections.map((section) => {
              const isActive = location.pathname.startsWith(section.path);
              return (
                <Link
                  key={section.id}
                  to={section.path}
                  onClick={onNavigate}
                  className={`
                    group block p-4 rounded-2xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-105
                    ${isActive 
                      ? `bg-gradient-to-r ${section.gradient} border-transparent text-white shadow-lg` 
                      : `${section.bgColor} ${section.borderColor} ${section.textColor} ${section.hoverBg} hover:border-opacity-70`
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md
                        ${isActive 
                          ? 'bg-white bg-opacity-20 backdrop-blur-sm' 
                          : 'bg-white shadow-lg'
                        }
                      `}>
                        <span className={`text-2xl ${isActive ? 'text-white' : ''}`}>
                          {section.icon}
                        </span>
                      </div>
                      <div>
                        <div className={`font-bold text-lg ${isActive ? 'text-white' : section.textColor}`}>
                          {section.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t-2 border-gray-200 pt-6">
          <div className="text-xs text-gray-500 text-center">
            إدارة حسابات المدرسين - الإصدار 2.0.0
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navigation;