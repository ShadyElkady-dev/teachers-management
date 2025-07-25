import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// إعداد الخطوط والإعدادات للغة العربية
document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

// إنشاء الجذر وتشغيل التطبيق
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);