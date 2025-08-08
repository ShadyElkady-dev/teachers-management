import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  // يستخرج المسار الحالي للصفحة
  const { pathname } = useLocation();

  // يتم تفعيله عند تغيير المسار
  useEffect(() => {
    // يقوم بإرجاع الصفحة إلى الأعلى
    window.scrollTo(0, 0);
  }, [pathname]); // <-- يعتمد على المسار

  return null; // هذا المكون لا يعرض أي شيء على الشاشة
};

export default ScrollToTop;