import React, { useState, useRef, useEffect } from 'react';

const SearchBar = ({ 
  value = '', 
  onChange, 
  placeholder = 'البحث...', 
  onSubmit,
  onClear,
  showClearButton = true,
  showSearchButton = false,
  disabled = false,
  className = '',
  suggestions = [],
  onSuggestionClick,
  autoComplete = true,
  size = 'medium'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // أحجام مختلفة
  const sizes = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-3 text-base',
    large: 'px-5 py-4 text-lg'
  };

  // معالجة تغيير النص
  const handleChange = (event) => {
    const newValue = event.target.value;
    onChange(newValue);
    
    // إظهار الاقتراحات إذا كان هناك نص وقائمة اقتراحات
    if (autoComplete && suggestions.length > 0 && newValue.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // معالجة الإرسال
  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(value);
    }
    setShowSuggestions(false);
  };

  // معالجة مسح النص
  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    if (onClear) {
      onClear();
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // معالجة التركيز
  const handleFocus = () => {
    setIsFocused(true);
    if (autoComplete && suggestions.length > 0 && value.trim()) {
      setShowSuggestions(true);
    }
  };

  // معالجة فقدان التركيز
  const handleBlur = () => {
    setIsFocused(false);
    // تأخير إخفاء الاقتراحات للسماح بالنقر عليها
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // معالجة الضغط على المفاتيح
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setShowSuggestions(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
    
    if (event.key === 'Enter' && !showSuggestions) {
      handleSubmit(event);
    }
  };

  // معالجة النقر على اقتراح
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setShowSuggestions(false);
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  // إغلاق الاقتراحات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* حقل البحث */}
        <div 
          className={`
            search-bar flex items-center bg-white border-2 rounded-xl transition-all duration-200
            ${isFocused ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {/* أيقونة البحث */}
          <div className="pr-4 text-gray-400">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>

          {/* حقل الإدخال */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              flex-1 bg-transparent border-none outline-none font-arabic
              ${sizes[size]}
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            autoComplete="off"
          />

          {/* أزرار التحكم */}
          <div className="flex items-center gap-2 pl-2">
            {/* زر المسح */}
            {showClearButton && value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="مسح البحث"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* زر البحث */}
            {showSearchButton && (
              <button
                type="submit"
                disabled={disabled}
                className="btn btn-primary btn-sm"
              >
                بحث
              </button>
            )}
          </div>
        </div>
      </form>

      {/* قائمة الاقتراحات */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions
            .filter(suggestion => 
              suggestion.toLowerCase().includes(value.toLowerCase())
            )
            .slice(0, 10) // حد أقصى 10 اقتراحات
            .map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-right px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-gray-700">{suggestion}</span>
                </div>
              </button>
            ))
          }
          
          {/* رسالة عدم وجود نتائج */}
          {suggestions.filter(suggestion => 
            suggestion.toLowerCase().includes(value.toLowerCase())
          ).length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-center">
              لا توجد اقتراحات مطابقة
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// مكون بحث متقدم
export const AdvancedSearchBar = ({ 
  filters = [],
  onSearch,
  onFilterChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* البحث الأساسي */}
      <SearchBar 
        placeholder="البحث السريع..."
        onSubmit={onSearch}
        showSearchButton={true}
      />

      {/* زر التوسع */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <span>{isExpanded ? 'إخفاء' : 'إظهار'} البحث المتقدم</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* الفلاتر المتقدمة */}
      {isExpanded && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 animate-slide-in-down">
          <h3 className="font-semibold text-gray-900 mb-3">البحث المتقدم</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                
                {filter.type === 'select' ? (
                  <select 
                    value={filter.value || ''}
                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    className="input w-full"
                  >
                    <option value="">الكل</option>
                    {filter.options.map((option, optIndex) => (
                      <option key={optIndex} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={filter.value || ''}
                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    className="input w-full"
                  />
                ) : (
                  <input
                    type="text"
                    value={filter.value || ''}
                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    className="input w-full"
                  />
                )}
              </div>
            ))}
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                filters.forEach(filter => onFilterChange(filter.key, ''));
              }}
              className="btn btn-secondary"
            >
              مسح الفلاتر
            </button>
            
            <button
              onClick={onSearch}
              className="btn btn-primary"
            >
              تطبيق البحث
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;