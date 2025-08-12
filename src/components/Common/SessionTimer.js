import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SessionTimer = () => {
  const { sessionTimeLeft, extendSession, isAuthenticated } = useAuth();
  const [timeLeft, setTimeLeft] = useState(sessionTimeLeft);

  // تحديث العداد المحلي لما الكونتكست يبعث قيمة جديدة (تمديد الجلسة مثلًا)
  useEffect(() => {
    setTimeLeft(sessionTimeLeft);
  }, [sessionTimeLeft]);

  // تشغيل عداد ينقص ثانية بثانية
  useEffect(() => {
    if (!isAuthenticated || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1000 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, timeLeft]);

  if (!isAuthenticated || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / (60 * 1000));
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

  const isWarning = minutes <= 5;
  const isCritical = minutes <= 2;

  const getColorClass = () => {
    if (isCritical) return 'from-red-500 to-red-600 animate-pulse';
    if (isWarning) return 'from-orange-500 to-orange-600';
    return 'from-green-500 to-green-600';
  };

  const getTextColor = () => {
    if (isCritical) return 'text-red-100';
    if (isWarning) return 'text-orange-100';
    return 'text-green-100';
  };

  const getIcon = () => {
    if (isCritical) return '🚨';
    if (isWarning) return '⚠️';
    return '⏰';
  };

  return (
    <div
      className={`relative bg-gradient-to-r ${getColorClass()} rounded-xl px-3 py-2 shadow-lg transition-all duration-300 cursor-pointer`}
onClick={() => {}}
title={`الوقت المتبقي: ${minutes}:${seconds.toString().padStart(2, '0')}`}
    >
      <div className="flex items-center gap-2">
        <div className="text-lg">{getIcon()}</div>
        <div className="text-center">
          <div className={`text-sm font-bold ${getTextColor()}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className={`text-xs ${getTextColor()} opacity-80`}>
            الجلسة
          </div>
        </div>
      </div>

      {/* مؤشر التقدم */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-1000 ease-linear"
          style={{
            width: `${Math.max(0, Math.min(100, (timeLeft / (30 * 60 * 1000)) * 100))}%`
          }}
        />
      </div>

      {isCritical && (
        <div className="absolute inset-0 rounded-xl bg-red-400 opacity-30 animate-ping"></div>
      )}
    </div>
  );
};

export default SessionTimer;
