import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth, PERMISSIONS, USER_ROLES } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { formatCurrency } from '../../utils/helpers';

const Navigation = ({ onNavigate }) => {
  const location = useLocation();
  const { state, calculateTotalProfit } = useAppContext();
  const { user, hasPermission } = useAuth();
  const [hoveredSection, setHoveredSection] = useState(null);

  const mainSections = [
    {
      id: 'teachers',
      name: 'المدرسين',
      icon: '👨‍🏫',
      path: '/teachers',
      permission: PERMISSIONS.VIEW_TEACHERS,
      gradient: 'from-indigo-500 via-indigo-600 to-purple-700',
      hoverGradient: 'from-indigo-400 via-indigo-500 to-purple-600',
      bgColor: 'from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      stats: state.teachers.length
    },
    {
      id: 'operations',
      name: 'العمليات',
      icon: '📝',
      path: '/operations',
      permission: PERMISSIONS.VIEW_OPERATIONS,
      gradient: 'from-green-500 via-green-600 to-emerald-700',
      hoverGradient: 'from-green-400 via-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      hideFor: USER_ROLES.SECRETARY,
      stats: state.operations.length
    },
    {
      id: 'accounts',
      name: 'الحسابات',
      icon: '💰',
      path: '/accounts',
      permission: PERMISSIONS.VIEW_PAYMENTS,
      gradient: 'from-purple-500 via-purple-600 to-pink-700',
      hoverGradient: 'from-purple-400 via-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      stats: state.payments.length
    },
    {
      id: 'expenses',
      name: 'المصروفات',
      icon: '💸',
      path: '/expenses',
      permission: PERMISSIONS.VIEW_EXPENSES,
      gradient: 'from-red-500 via-red-600 to-rose-700',
      hoverGradient: 'from-red-400 via-red-500 to-rose-600',
      bgColor: 'from-red-50 to-red-100',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      stats: state.expenses?.length || 0
    },
    {
      id: 'reports',
      name: 'التقارير',
      icon: '📊',
      path: '/reports',
      permission: PERMISSIONS.VIEW_REPORTS,
      gradient: 'from-teal-500 via-teal-600 to-cyan-700',
      hoverGradient: 'from-teal-400 via-teal-500 to-cyan-600',
      bgColor: 'from-teal-50 to-teal-100',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-700',
      stats: '📈'
    }
  ];

  const availableSections = mainSections.filter(section => 
    (!section.permission || hasPermission(section.permission)) && section.hideFor !== user.role
  );

  // حساب إجمالي الأرباح للإحصائيات
  const totalProfit = hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? calculateTotalProfit() : 0;

  return (
    <nav className="h-full bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* خلفية ديناميكية مخففة */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl animate-blob"></div>
        <div className="absolute bottom-20 left-0 w-20 h-20 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-4 h-full flex flex-col">
        
        {/* بطاقة المستخدم المحسنة */}
        <div className="mb-6 relative">
          <div className={`
            bg-gradient-to-r ${user?.role === 'admin' 
              ? 'from-purple-500 via-indigo-600 to-blue-700' 
              : 'from-blue-500 via-cyan-600 to-teal-700'} 
            rounded-2xl p-4 text-white shadow-xl relative overflow-hidden transform transition-all duration-300 hover:scale-[1.02]
          `}>
            {/* خلفية متحركة مخففة */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl opacity-50"></div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full blur-2xl opacity-50"></div>
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative group">
                <div className="relative w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-xl border border-white/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">
                      {user?.name?.charAt(0) || '👤'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white mb-1">
                  مرحباً، {user?.name}
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 bg-gradient-to-br ${user?.role === 'admin' ? 'from-yellow-400 to-orange-500' : 'from-blue-400 to-indigo-500'} rounded-lg flex items-center justify-center shadow-md`}>
                    <span className="text-sm">{user?.role === 'admin' ? '👑' : '📝'}</span>
                  </div>
                  <p className="text-white/90 font-medium">
                    {user?.role === 'admin' ? 'مدير النظام' : 'السكرتارية'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-white/80 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">متصل الآن</span>
                </div>
              </div>
            </div>
            
            {/* إحصائية سريعة */}
            {hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-medium">إجمالي الأرباح</p>
                    <p className="text-white text-base font-bold">{formatCurrency(totalProfit)}</p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">💰</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* عنوان الأقسام */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-sm text-white">🏠</span>
            </div>
            الأقسام الرئيسية
          </h3>
          <div className="w-full h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
        </div>
        
        {/* قائمة الأقسام المحسنة */}
        <div className="flex-1 space-y-2">
          {availableSections.map((section) => {
            const isActive = location.pathname.startsWith(section.path);
            const isHovered = hoveredSection === section.id;
            
            return (
              <Link
                key={section.id}
                to={section.path}
                onClick={onNavigate}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                className={`
                  group block relative overflow-hidden rounded-2xl transition-all duration-300 transform
                  ${isActive 
                    ? `bg-gradient-to-r ${section.gradient} text-white shadow-xl scale-[1.02] border border-white/20` 
                    : `bg-gradient-to-br ${section.bgColor} ${section.textColor} shadow-md hover:shadow-lg border ${section.borderColor} hover:scale-[1.02] hover:border-opacity-70`
                  }
                `}
              >
                {/* خلفية ديناميكية للعنصر النشط */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/10 rounded-full blur-xl animate-pulse opacity-60"></div>
                    <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-white/5 rounded-full blur-2xl opacity-40"></div>
                  </>
                )}
                
                {/* تأثير التمرير للعناصر غير النشطة */}
                {!isActive && isHovered && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent"></div>
                )}
                
                <div className="relative z-10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* أيقونة القسم */}
                      <div className={`
                        w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md relative overflow-hidden
                        ${isActive 
                          ? 'bg-white/25 backdrop-blur-xl border border-white/30' 
                          : 'bg-white shadow-md hover:shadow-lg border border-white/50'
                        }
                      `}>
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5"></div>
                        )}
                        <span className={`text-xl transition-all duration-300 relative z-10 ${
                          isActive ? 'text-white' : 'group-hover:scale-110'
                        }`}>
                          {section.icon}
                        </span>
                      </div>
                      
                      {/* اسم القسم فقط */}
                      <div>
                        <div className={`font-bold text-base ${
                          isActive ? 'text-white' : section.textColor
                        }`}>
                          {section.name}
                        </div>
                      </div>
                    </div>
                    
                    {/* إحصائيات القسم */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs
                      ${isActive 
                        ? 'bg-white/25 text-white border border-white/30' 
                        : 'bg-white/80 text-gray-700 border border-gray-200'
                      }
                    `}>
                      {section.stats}
                    </div>
                  </div>
                  
                  {/* مؤشر نشاط - خط متحرك زي جوجل */}
                  {isActive && (
                    <div className="w-full mt-3">
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative">
                        <div className="absolute h-full w-8 bg-white/80 rounded-full animate-loading-line shadow-sm"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* مؤشر التمرير */}
                  {!isActive && isHovered && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* تذييل التطبيق */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-3 shadow-inner">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-white">📱</span>
                </div>
                <span className="text-sm font-bold text-gray-700">إدارة حسابات المدرسين</span>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                الإصدار 2.0.0 - تطوير شادى القاضى
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">نظام محسن ومطور</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* الأنماط المخصصة */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(15px, -25px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
        }

        @keyframes loading-line {
          0% { 
            left: -32px; 
            opacity: 0;
          }
          20% { 
            opacity: 1;
          }
          50% { 
            left: 50%; 
            transform: translateX(-50%);
            opacity: 1;
          }
          80% { 
            opacity: 1;
          }
          100% { 
            left: 100%; 
            opacity: 0;
          }
        }

        .animate-blob {
          animation: blob 8s infinite;
        }

        .animate-loading-line {
          animation: loading-line 2s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;