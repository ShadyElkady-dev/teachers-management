import { formatCurrency, formatDate } from '../../utils/helpers';
import { translateOperationType, translatePaymentMethod, translateExpenseType, safeTranslate } from '../../utils/translations';

export const generateReportHTML = (config, data, stats) => {
  // التحقق من نوع التقرير
  if (config.type === 'expenses_report') {
    return generateExpensesReportHTML(config, data, stats);
  }
  
  // تقرير المدرسين العادي
  return generateTeachersReportHTML(config, data, stats);
};

// تقرير المصروفات الخاصة
const generateExpensesReportHTML = (config, data, stats) => {
  const { expenses = [] } = data;
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title || 'تقرير المصروفات الخاصة'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', sans-serif;
          line-height: 1.5;
          color: #333;
          background: white;
          font-size: 12px;
        }
        
        .print-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #2563eb;
          color: white;
          padding: 10px;
          z-index: 1000;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .toolbar-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        
        .toolbar-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .back-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 60px 20px 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 20px;
          position: relative;
        }
        
        .logo-container {
          position: absolute;
          top: 0;
          left: 0;
        }
        
        .company-logo {
          max-height: 80px;
          max-width: 150px;
          object-fit: contain;
        }
        
        .report-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 10px;
        }
        
        .meta-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          font-size: 11px;
          color: #6b7280;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .stat-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 11px;
          color: #6b7280;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        th {
          background: #f9fafb;
          padding: 10px;
          text-align: right;
          font-weight: 600;
          font-size: 11px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        td {
          padding: 10px;
          text-align: right;
          font-size: 11px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .col-date { width: 100px; }
        .col-desc { min-width: 250px; }
        .col-vendor { width: 150px; }
        .col-payment { width: 100px; }
        .col-amount { 
          width: 100px;
          text-align: left;
          font-weight: 600;
        }
        
        .totals-row {
          background: #f9fafb;
          font-weight: 700;
        }
        
        @media print {
          .print-toolbar {
            display: none !important;
          }
          
          .container {
            padding: 10px;
          }
          
          @page {
            margin: 1cm;
            size: ${config.formatting?.pageSize || 'A4'};
          }
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
          .container {
            padding: 80px 10px 20px;
          }
          
          .print-toolbar {
            padding: 15px 10px;
          }
          
          .toolbar-btn {
            padding: 10px 20px;
            font-size: 14px;
          }
          
          .back-btn {
            margin-left: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-toolbar">
        <div class="toolbar-right">
          <button class="toolbar-btn back-btn" onclick="window.close()">← رجوع</button>
          <span style="margin-right: 10px;">${config.title || 'تقرير المصروفات الخاصة'}</span>
        </div>
        <button class="toolbar-btn" onclick="window.print()">🖨️ طباعة</button>
      </div>

      <div class="container">
        <div class="header">
          <div class="logo-container">
            <img src="${config.logoUrl || 'https://i.postimg.cc/664vwM9j/logo.png'}" alt="Logo" class="company-logo">
          </div>
          <div class="report-title">${config.title || 'تقرير المصروفات الخاصة'}</div>
          <div class="meta-info">
            <span>📅 ${formatDate(new Date())}</span>
            ${config.dateRange?.from ? `<span>📊 ${formatDate(config.dateRange.from)} - ${formatDate(config.dateRange.to)}</span>` : ''}
            <span>💰 ${expenses.length} مصروف</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" style="color: #dc2626;">${formatCurrency(totalExpenses)}</div>
            <div class="stat-label">إجمالي المصروفات</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #2563eb;">${expenses.length}</div>
            <div class="stat-label">عدد المصروفات</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #9333ea;">${formatCurrency(totalExpenses / (expenses.length || 1))}</div>
            <div class="stat-label">متوسط المصروف</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th class="col-date">التاريخ</th>
              <th class="col-desc">الوصف</th>
              <th class="col-vendor">المورد/الجهة</th>
              <th class="col-payment">طريقة الدفع</th>
              <th class="col-amount">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((expense, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${formatDate(expense.date || expense.expenseDate || new Date())}</td>
                <td>${expense.description || '-'}</td>
                <td>${expense.vendor || expense.recipient || '-'}</td>
                <td>${safeTranslate(expense.paymentMethod, translatePaymentMethod)}</td>
                <td class="col-amount">${formatCurrency(expense.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="5" style="text-align: left; font-weight: 700;">الإجمالي</td>
              <td class="col-amount">${formatCurrency(totalExpenses)}</td>
            </tr>
          </tfoot>
        </table>

        ${expenses.length === 0 ? '<div style="text-align: center; padding: 40px; color: #9ca3af;">لا توجد مصروفات في الفترة المحددة</div>' : ''}
      </div>
    </body>
    </html>
  `;
};

// تقرير المدرسين
const generateTeachersReportHTML = (config, data, stats) => {
  const { teachers, operations, payments } = data;
  
  const getTeacherData = (teacher) => {
    const teacherOps = operations.filter(op => op.teacherId === teacher.id);
    const teacherPays = payments.filter(p => p.teacherId === teacher.id);
    const totalOps = teacherOps.reduce((sum, op) => sum + (op.amount || 0), 0);
    const totalPays = teacherPays.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      operations: teacherOps,
      payments: teacherPays,
      totalOperations: totalOps,
      totalPayments: totalPays,
      balance: totalOps - totalPays
    };
  };

  const showOperations = config.includedSections?.operations !== false;
  const showPayments = config.includedSections?.payments !== false;
  const showBalance = config.includedSections?.balance !== false;

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', sans-serif;
          line-height: 1.5;
          color: #333;
          background: white;
          font-size: 12px;
        }
        
        .print-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #2563eb;
          color: white;
          padding: 10px;
          z-index: 1000;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .toolbar-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        
        .toolbar-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .back-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 60px 20px 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 20px;
          position: relative;
        }
        
        .logo-container {
          position: absolute;
          top: 0;
          left: 0;
        }
        
        .company-logo {
          max-height: 80px;
          max-width: 150px;
          object-fit: contain;
        }
        
        .report-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 10px;
        }
        
        .meta-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          font-size: 11px;
          color: #6b7280;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .stat-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 11px;
          color: #6b7280;
        }
        
        .teacher-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .teacher-card.separate-pages {
          page-break-before: always;
        }
        
        .teacher-card.separate-pages:first-child {
          page-break-before: auto;
        }
        
        .teacher-header {
          background: #f3f4f6;
          padding: 12px 15px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .teacher-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .teacher-balance {
          font-size: 14px;
          font-weight: 700;
        }
        
        .balance-positive { color: #dc2626; }
        .balance-negative { color: #16a34a; }
        
        .teacher-content {
          padding: 15px;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        th {
          background: #f9fafb;
          padding: 8px;
          text-align: right;
          font-weight: 600;
          font-size: 11px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        td {
          padding: 8px;
          text-align: right;
          font-size: 11px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .col-amount { 
          text-align: left;
          font-weight: 600;
        }
        
        .totals-row {
          background: #f9fafb;
          font-weight: 600;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 10px;
          background: #f9fafb;
          border-radius: 6px;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-value {
          font-size: 13px;
          font-weight: 700;
        }
        
        .summary-label {
          font-size: 10px;
          color: #6b7280;
        }
        
        @media print {
          .print-toolbar {
            display: none !important;
          }
          
          .container {
            padding: 10px;
          }
          
          .teacher-card {
            page-break-inside: avoid;
            margin-bottom: 0;
          }
          
          .teacher-card.separate-pages {
            page-break-before: always;
          }
          
          .teacher-card.separate-pages:first-child {
            page-break-before: auto;
          }
          
          .stats-grid {
            ${config.formatting?.separatePages !== false ? 'page-break-after: always;' : ''}
          }
          
          @page {
            margin: 1cm;
            size: ${config.formatting?.pageSize || 'A4'};
          }
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
          .container {
            padding: 80px 10px 20px;
          }
          
          .print-toolbar {
            padding: 15px 10px;
          }
          
          .toolbar-btn {
            padding: 10px 20px;
            font-size: 14px;
          }
          
          .back-btn {
            margin-left: 10px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .teacher-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .summary-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-toolbar">
        <div class="toolbar-right">
          <button class="toolbar-btn back-btn" onclick="window.close()">← رجوع</button>
          <span style="margin-right: 10px;">${config.title}</span>
        </div>
        <button class="toolbar-btn" onclick="window.print()">🖨️ طباعة</button>
      </div>

      <div class="container">
        <div class="header">
          <div class="logo-container">
            <img src="${config.logoUrl || 'https://i.postimg.cc/664vwM9j/logo.png'}" alt="Logo" class="company-logo">
          </div>
          <div class="report-title">${config.title}</div>
          <div class="meta-info">
            <span>📅 ${formatDate(new Date())}</span>
            ${config.dateRange?.from ? `<span>📊 ${formatDate(config.dateRange.from)} - ${formatDate(config.dateRange.to)}</span>` : ''}
            <span>👥 ${stats.teachersCount} مدرس</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" style="color: #2563eb;">${formatCurrency(stats.totalOperations)}</div>
            <div class="stat-label">إجمالي العمليات</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #16a34a;">${formatCurrency(stats.totalPayments)}</div>
            <div class="stat-label">إجمالي المدفوعات</div>
          </div>
          <div class="stat-card">
            <div class="stat-value ${stats.balance > 0 ? 'balance-positive' : ''}">${formatCurrency(Math.abs(stats.balance))}</div>
            <div class="stat-label">${stats.balance > 0 ? 'إجمالي المستحق' : 'الرصيد'}</div>
          </div>
        </div>

        ${teachers.map((teacher, index) => {
          const teacherData = getTeacherData(teacher);
          const separatePages = config.formatting?.separatePages !== false;
          
          return `
            <div class="teacher-card ${separatePages ? 'separate-pages' : ''}">
              <div class="teacher-header">
                <div class="teacher-name">${index + 1}. ${teacher.name || 'غير محدد'}</div>
                ${showBalance ? `
                  <div class="teacher-balance ${teacherData.balance > 0 ? 'balance-positive' : 'balance-negative'}">
                    ${formatCurrency(Math.abs(teacherData.balance))} ${teacherData.balance > 0 ? '(مستحق)' : teacherData.balance < 0 ? '(رصيد)' : ''}
                  </div>
                ` : ''}
              </div>
              
              <div class="teacher-content">
                ${showOperations && teacherData.operations.length > 0 ? `
                  <div class="section-title">📋 العمليات (${teacherData.operations.length})</div>
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>النوع</th>
                        <th>الوصف</th>
                        <th>الكمية</th>
                        <th class="col-amount">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${teacherData.operations.map(op => `
                        <tr>
                          <td>${formatDate(op.operationDate)}</td>
                          <td>${safeTranslate(op.type, translateOperationType)}</td>
                          <td>${op.description || '-'}</td>
                          <td>${op.quantity || 0}</td>
                          <td class="col-amount">${formatCurrency(op.amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="totals-row">
                        <td colspan="4">الإجمالي</td>
                        <td class="col-amount">${formatCurrency(teacherData.totalOperations)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ` : ''}

                ${showPayments && teacherData.payments.length > 0 ? `
                  <div class="section-title">💰 المدفوعات (${teacherData.payments.length})</div>
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>طريقة الدفع</th>
                        <th>ملاحظات</th>
                        <th class="col-amount">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${teacherData.payments.map(payment => `
                        <tr>
                          <td>${formatDate(payment.paymentDate)}</td>
                          <td>${safeTranslate(payment.paymentMethod, translatePaymentMethod)}</td>
                          <td>${payment.notes || '-'}</td>
                          <td class="col-amount">${formatCurrency(payment.amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="totals-row">
                        <td colspan="3">الإجمالي</td>
                        <td class="col-amount">${formatCurrency(teacherData.totalPayments)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ` : ''}

                ${showBalance ? `
                  <div class="summary-grid">
                    <div class="summary-item">
                      <div class="summary-value" style="color: #2563eb;">${formatCurrency(teacherData.totalOperations)}</div>
                      <div class="summary-label">العمليات</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-value" style="color: #16a34a;">${formatCurrency(teacherData.totalPayments)}</div>
                      <div class="summary-label">المدفوعات</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-value ${teacherData.balance > 0 ? 'balance-positive' : ''}">${formatCurrency(Math.abs(teacherData.balance))}</div>
                      <div class="summary-label">${teacherData.balance > 0 ? 'المستحق' : 'الرصيد'}</div>
                    </div>
                  </div>
                ` : ''}

                ${teacherData.operations.length === 0 && teacherData.payments.length === 0 ? `
                  <div style="text-align: center; padding: 30px; color: #9ca3af;">لا توجد بيانات لهذا المدرس</div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </body>
    </html>
  `;
};