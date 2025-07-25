import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = '', 
  className = '',
  fullScreen = false 
}) => {
  
  // أحجام مختلفة للـ spinner
  const sizes = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
    extra: 'w-16 h-16 border-4'
  };

  // ألوان مختلفة
  const colors = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    success: 'border-green-600 border-t-transparent',
    warning: 'border-yellow-600 border-t-transparent',
    error: 'border-red-600 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  const spinnerClasses = `
    ${sizes[size]} 
    ${colors[color]} 
    border-solid 
    rounded-full 
    animate-spin 
    ${className}
  `;

  const textColors = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    white: 'text-white'
  };

  // إذا كان fullScreen، نعرض spinner في منتصف الشاشة
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className={spinnerClasses}></div>
          {text && (
            <p className={`mt-4 font-medium ${textColors[color]}`}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // عرض عادي
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClasses}></div>
      {text && (
        <p className={`mt-2 text-sm font-medium ${textColors[color]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

// مكون تحميل للأزرار
export const ButtonSpinner = ({ size = 'small', color = 'white' }) => {
  return <LoadingSpinner size={size} color={color} className="inline-block" />;
};

// مكون تحميل للصفحات
export const PageSpinner = ({ text = 'جاري التحميل...' }) => {
  return (
    <LoadingSpinner 
      size="large" 
      color="primary" 
      text={text} 
      fullScreen={true}
    />
  );
};

// مكون تحميل للبطاقات
export const CardSpinner = ({ text = '' }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="medium" color="primary" text={text} />
    </div>
  );
};

// مكون تحميل نقطي (dots)
export const DotSpinner = ({ color = 'primary' }) => {
  const dotColors = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div className="flex space-x-1 rtl:space-x-reverse">
      <div className={`w-2 h-2 ${dotColors[color]} rounded-full animate-bounce`}></div>
      <div className={`w-2 h-2 ${dotColors[color]} rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
      <div className={`w-2 h-2 ${dotColors[color]} rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
    </div>
  );
};

// مكون تحميل للهيكل العظمي
export const SkeletonLoader = ({ className = '', lines = 3 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`bg-gray-200 rounded h-4 mb-3 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
};

// مكون تحميل للبطاقات
export const CardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
};

// مكون تحميل للجداول
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// مكون تحميل مخصص للقوائم
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse p-4 bg-white border border-gray-200 rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-16 h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;