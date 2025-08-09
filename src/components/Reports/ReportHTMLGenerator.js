import { formatCurrency, formatDate } from '../../utils/helpers';

export const generateReportHTML = (config, data, stats) => {
  const { teachers, operations, payments } = data;
  
  // دالة لحساب بيانات كل مدرس
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

  const showOperations = config.includedSections?.operations === true || 
                        (config.includedSections?.operations === undefined && true);
  const showPayments = config.includedSections?.payments === true || 
                      (config.includedSections?.payments === undefined && true);
  const showBalance = config.includedSections?.balance === true || 
                     (config.includedSections?.balance === undefined && true);

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
        }
        
        .toolbar-btn:hover {
          background: rgba(255,255,255,0.3);
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
          table-layout: auto;
        }
        
        th {
          background: #f9fafb;
          padding: 8px;
          text-align: right;
          font-weight: 600;
          font-size: 11px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        
        td {
          padding: 8px;
          text-align: right;
          font-size: 11px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }
        
        .col-date { 
          width: 80px;
          white-space: nowrap;
        }
        .col-type { 
          width: 80px;
        }
        .col-desc { 
          min-width: 200px;
          word-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
          line-height: 1.4;
        }
        .col-qty { 
          width: 50px;
          text-align: center;
        }
        .col-amount { 
          width: 100px;
          text-align: left;
          font-weight: 600;
          white-space: nowrap;
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
        
        .empty-message {
          text-align: center;
          padding: 30px;
          color: #9ca3af;
        }
        
        @media print {
          .print-toolbar {
            display: none !important;
          }
          
          .container {
            padding: 10px;
          }
          
          body {
            font-size: 10px;
          }
          
          .teacher-card {
            page-break-inside: avoid;
          }
          
          @page {
            margin: 1cm;
            size: ${config.formatting?.pageSize || 'A4'};
          }
        }
          .header {
  text-align: center;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 20px;
  margin-bottom: 20px;
  position: relative; /* مهم عشان نحدد مكان اللوجو */
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
      </style>
    </head>
    <body>
      <div class="print-toolbar">
        <div>${config.title}</div>
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
          
          return `
            <div class="teacher-card">
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
                        <th class="col-date">التاريخ</th>
                        <th class="col-type">النوع</th>
                        <th class="col-desc">الوصف</th>
                        <th class="col-qty">الكمية</th>
                        <th class="col-amount">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${teacherData.operations.map(op => `
                        <tr>
                          <td class="col-date">${formatDate(op.operationDate)}</td>
                          <td class="col-type">${op.type || '-'}</td>
                          <td class="col-desc">${op.description || '-'}</td>
                          <td class="col-qty">${op.quantity || 0}</td>
                          <td class="col-amount">${formatCurrency(op.amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="totals-row">
                        <td colspan="4" style="text-align: left; font-weight: 600;">الإجمالي</td>
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
                        <th class="col-date">التاريخ</th>
                        <th class="col-type">طريقة الدفع</th>
                        <th class="col-desc">ملاحظات</th>
                        <th class="col-amount">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${teacherData.payments.map(payment => `
                        <tr>
                          <td class="col-date">${formatDate(payment.paymentDate)}</td>
                          <td class="col-type">${payment.paymentMethod || '-'}</td>
                          <td class="col-desc">${payment.notes || '-'}</td>
                          <td class="col-amount">${formatCurrency(payment.amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="totals-row">
                        <td colspan="3" style="text-align: left; font-weight: 600;">الإجمالي</td>
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
                  <div class="empty-message">لا توجد بيانات لهذا المدرس</div>
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