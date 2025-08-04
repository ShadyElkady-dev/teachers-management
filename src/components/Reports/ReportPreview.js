import React, { useState } from 'react';
import { FiX, FiFileText } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ReportPreview = ({ reportData, onDownloadPDF, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const { config, data, metadata } = reportData;

  // التحقق من وجود مصروفات وأنها مطلوبة
  const shouldShowExpenses = () => {
    // إذا كان نوع التقرير خاص بالمصروفات
    if (['expenses_report', 'expenses_detailed'].includes(config.type)) {
      return true;
    }
    // أو إذا كان مفعل في الإعدادات وتوجد مصروفات فعلية
    return config.includeExpenses && data.expenses && data.expenses.length > 0;
  };

  // دالة إنشاء وعرض HTML مع زر طباعة
  const generateAndShowHTML = () => {
    setIsPrinting(true);
    
    try {
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      // دوال مساعدة لتحويل الرموز إلى نصوص
      const getCategoryLabel = (category) => {
        const categories = {
          'office_supplies': 'مستلزمات مكتبية',
          'utilities': 'فواتير وخدمات',
          'maintenance': 'صيانة',
          'transportation': 'مواصلات',
          'marketing': 'تسويق',
          'equipment': 'معدات',
          'other': 'أخرى'
        };
        return categories[category] || category;
      };
      
      const getPaymentMethodLabel = (method) => {
        const methods = {
          'cash': 'نقدي',
          'bank_transfer': 'تحويل بنكي',
          'credit_card': 'بطاقة ائتمان',
          'check': 'شيك'
        };
        return methods[method] || method;
      };
      
      const htmlContent = `
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
              font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #2c3e50;
              background: #f8fafc;
              font-size: 14px;
            }
            
            .print-toolbar {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
              color: white;
              padding: 15px 20px;
              z-index: 1000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .toolbar-title {
              font-size: 18px;
              font-weight: 600;
            }
            
            .toolbar-buttons {
              display: flex;
              gap: 15px;
            }
            
            .toolbar-btn {
              background: rgba(255,255,255,0.2);
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 8px;
              backdrop-filter: blur(10px);
            }
            
            .toolbar-btn:hover {
              background: rgba(255,255,255,0.3);
              transform: translateY(-2px);
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            
            .print-btn {
              background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
              font-size: 16px;
              padding: 12px 25px;
            }
            
            .print-btn:hover {
              background: linear-gradient(135deg, #229954 0%, #1e8449 100%);
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 90px 20px 20px 20px;
            }
            
            .header {
              text-align: center;
              border-bottom: 3px solid #3498db;
              padding-bottom: 30px;
              margin-bottom: 40px;
              background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);
              padding: 30px 20px;
              border-radius: 15px;
              box-shadow: 0 4px 15px rgba(52, 152, 219, 0.1);
            }
            
            .logo {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #3498db, #2980b9);
              border-radius: 50%;
              margin: 0 auto 20px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 32px;
              font-weight: bold;
              box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
            }
            
            .company-name {
              font-size: 28px;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 10px;
              letter-spacing: -0.5px;
            }
            
            .report-title {
              font-size: 24px;
              font-weight: 600;
              color: #3498db;
              margin-bottom: 15px;
            }
            
            .meta-info {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 20px;
              font-size: 13px;
              color: #7f8c8d;
            }
            
            .meta-item {
              background: rgba(255, 255, 255, 0.8);
              padding: 10px 15px;
              border-radius: 8px;
              border-right: 4px solid #3498db;
            }
            
            .meta-label {
              font-weight: 600;
              color: #2c3e50;
            }
            
            .quick-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 40px;
            }
            
            .stat-card {
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              border: 2px solid #e3f2fd;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 4px  15px rgba(0, 0, 0, 0.05);
            }
            
            .stat-value {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 5px;
            }
            
            .stat-label {
              font-size: 12px;
              color: #7f8c8d;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .stat-card.blue { 
              background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
              color: white;
            }
            .stat-card.green { 
              background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
              color: white;
            }
            .stat-card.purple { 
              background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
              color: white;
            }
            .stat-card.orange { 
              background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
              color: white;
            }
            
            .teacher-card {
              background: #ffffff;
              border: 2px solid #ecf0f1;
              border-radius: 15px;
              margin-bottom: 35px;
              overflow: hidden;
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            }
            
            .teacher-header {
              background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
              color: white;
              padding: 25px 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .teacher-info h3 {
              font-size: 22px;
              font-weight: 700;
              margin-bottom: 5px;
            }
            
            .teacher-id {
              font-size: 14px;
              opacity: 0.9;
            }
            
            .balance-info {
              text-align: left;
            }
            
            .balance-amount {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 5px;
            }
            
            .balance-label {
              font-size: 12px;
              opacity: 0.9;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .teacher-content {
              padding: 30px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #ecf0f1;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .section-title::before {
              content: '';
              width: 4px;
              height: 20px;
              background: #3498db;
              border-radius: 2px;
            }
            
            .table-container {
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              margin-bottom: 25px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
              border: 1px solid #ecf0f1;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            
            th {
              background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
              color: white;
              padding: 15px 12px;
              text-align: center;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            td {
              padding: 12px;
              text-align: center;
              border-bottom: 1px solid #ecf0f1;
              vertical-align: middle;
            }
            
            tbody tr:nth-child(even) {
              background-color: #f8fafc;
            }
            
            tbody tr:hover {
              background-color: #e3f2fd;
            }
            
            .totals-row {
              background: linear-gradient(135deg, #ecf0f1 0%, #d5dbdb 100%);
              font-weight: 600;
              color: #2c3e50;
            }
            
            .totals-row td {
              border-bottom: none;
              padding: 15px 12px;
            }
            
            .balance-summary {
              background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);
              border: 2px solid #3498db;
              border-radius: 12px;
              padding: 20px;
              margin-top: 20px;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            
            .balance-item {
              text-align: center;
            }
            
            .balance-item-label {
              font-size: 12px;
              color: #7f8c8d;
              font-weight: 500;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .balance-item-value {
              font-size: 18px;
              font-weight: 700;
              font-family: 'Courier New', monospace;
            }
            
            .positive { color: #e74c3c; }
            .negative { color: #27ae60; }
            .neutral { color: #7f8c8d; }
            
            .final-summary {
              background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
              color: white;
              padding: 40px;
              border-radius: 15px;
              margin-top: 40px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(44, 62, 80, 0.3);
            }
            
            .summary-title {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 30px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 30px;
              margin-top: 20px;
            }
            
            .summary-item {
              background: rgba(255, 255, 255, 0.1);
              padding: 25px 20px;
              border-radius: 12px;
              backdrop-filter: blur(10px);
            }
            
            .summary-item-value {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              font-family: 'Courier New', monospace;
            }
            
            .summary-item-label {
              font-size: 14px;
              opacity: 0.9;
              font-weight: 500;
            }
            
            .empty-message {
              text-align: center;
              padding: 60px 20px;
              color: #7f8c8d;
              background: #f8fafc;
              border-radius: 12px;
              border: 2px dashed #bdc3c7;
              margin: 20px 0;
            }
            
            .empty-icon {
              font-size: 48px;
              margin-bottom: 15px;
              opacity: 0.6;
            }
            
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              body {
                margin: 0;
                font-size: 11px;
                background: white !important;
              }
              
              .print-toolbar {
                display: none !important;
              }
              
              .container {
                max-width: none;
                padding: 10px;
              }
              
              @page {
                margin: 1cm;
                size: A4;
              }
            }
            
            @media (max-width: 768px) {
              .print-toolbar {
                flex-direction: column;
                gap: 10px;
                text-align: center;
              }
              
              .toolbar-buttons {
                flex-wrap: wrap;
                justify-content: center;
              }
              
              .container {
                padding-top: 120px;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-toolbar">
            <div class="toolbar-title">📋 ${config.title}</div>
            <div class="toolbar-buttons">
              <button class="toolbar-btn print-btn" onclick="printDocument()">
                🖨️ طباعة التقرير
              </button>
              <button class="toolbar-btn" onclick="window.close()">
                ❌ إغلاق
              </button>
            </div>
          </div>

          <div class="container">
            <div class="header">
              <div class="logo">📊</div>
              <div class="company-name">نظام إدارة المدرسين</div>
              <div class="report-title">${config.title}</div>
              
              <div class="meta-info">
                <div class="meta-item">
                  <div class="meta-label">تاريخ الإنشاء</div>
                  <div>${formatDate(metadata.generatedAt)}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">المستخدم</div>
                  <div>${metadata.generatedBy}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">عدد المدرسين</div>
                  <div>${metadata.totalTeachers} مدرس</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">الفترة الزمنية</div>
                  <div>${config.dateRange?.from ? formatDate(config.dateRange.from) : 'غير محدد'} - ${config.dateRange?.to ? formatDate(config.dateRange.to) : 'غير محدد'}</div>
                </div>
              </div>
            </div>

            <div class="quick-stats">
              <div class="stat-card blue">
                <div class="stat-value">${metadata.totalTeachers}</div>
                <div class="stat-label">مدرس</div>
              </div>
              <div class="stat-card green">
                <div class="stat-value">${metadata.totalOperations}</div>
                <div class="stat-label">عملية</div>
              </div>
              <div class="stat-card purple">
                <div class="stat-value">${formatCurrency(metadata.totalAmount)}</div>
                <div class="stat-label">إجمالي المبلغ</div>
              </div>
              <div class="stat-card orange">
                <div class="stat-value">${formatCurrency(metadata.totalPaid)}</div>
                <div class="stat-label">إجمالي المدفوعات</div>
              </div>
              ${shouldShowExpenses() && metadata.totalExpenses > 0 ? `
                <div class="stat-card" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white;">
                  <div class="stat-value">${metadata.totalExpenses}</div>
                  <div class="stat-label">مصروفات خاصة</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%); color: white;">
                  <div class="stat-value">${formatCurrency(metadata.totalExpensesAmount || 0)}</div>
                  <div class="stat-label">إجمالي المصروفات</div>
                </div>
              ` : ''}
            </div>

            ${shouldShowExpenses() && data.expenses && data.expenses.length > 0 ? `
              <div class="teacher-card" style="margin-bottom: 40px;">
                <div class="teacher-header" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                  <div class="teacher-info">
                    <h3>💰 المصروفات الخاصة</h3>
                    <div class="teacher-id">العدد: ${data.expenses.length} مصروف</div>
                  </div>
                  <div class="balance-info">
                    <div class="balance-amount">${formatCurrency(data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0))}</div>
                    <div class="balance-label">إجمالي المصروفات</div>
                  </div>
                </div>
                
                <div class="teacher-content">
                  <div class="section-title">🧾 تفاصيل المصروفات</div>
                  <div class="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>التاريخ</th>
                          <th>البيان</th>
                          <th>الفئة</th>
                          <th>طريقة الدفع</th>
                          <th>المبلغ</th>
                          <th>ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${data.expenses.map((expense, i) => `
                          <tr>
                            <td>${i + 1}</td>
                            <td>${formatDate(expense.expenseDate) || 'غير محدد'}</td>
                            <td>${expense.description || 'غير محدد'}</td>
                            <td>${getCategoryLabel(expense.category) || 'غير محدد'}</td>
                            <td>${getPaymentMethodLabel(expense.paymentMethod) || 'غير محدد'}</td>
                            <td><strong>${formatCurrency(expense.amount || 0)}</strong></td>
                            <td>${expense.notes || '-'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                      <tfoot>
                        <tr class="totals-row">
                          <td colspan="6"><strong>إجمالي المصروفات</strong></td>
                          <td><strong>${formatCurrency(data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0))}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div class="balance-summary">
                    <div class="balance-item">
                      <div class="balance-item-label">عدد المصروفات</div>
                      <div class="balance-item-value">${data.expenses.length}</div>
                    </div>
                    <div class="balance-item">
                      <div class="balance-item-label">متوسط المصروف</div>
                      <div class="balance-item-value">${formatCurrency(data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) / data.expenses.length)}</div>
                    </div>
                    <div class="balance-item">
                      <div class="balance-item-label">أكبر مصروف</div>
                      <div class="balance-item-value">${formatCurrency(Math.max(...data.expenses.map(exp => exp.amount || 0)))}</div>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

            ${data.teachers && data.teachers.length > 0 ? data.teachers.map((teacher, index) => {
              const teacherOperations = data.operations ? data.operations.filter(op => op.teacherId === teacher.id) : [];
              const teacherPayments = data.payments ? data.payments.filter(p => p.teacherId === teacher.id) : [];
              const totalOperations = teacherOperations.reduce((sum, op) => sum + (op.amount || 0), 0);
              const totalPayments = teacherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
              const balance = totalOperations - totalPayments;

              return `
                <div class="teacher-card">
                  <div class="teacher-header">
                    <div class="teacher-info">
                      <h3>${index + 1}. ${teacher.name || 'مدرس غير معروف'}</h3>
                      <div class="teacher-id">رقم المدرس: ${teacher.id}</div>
                    </div>
                    <div class="balance-info">
                      <div class="balance-amount ${balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral'}">
                        ${balance > 0 ? `+${formatCurrency(balance)}` : balance < 0 ? formatCurrency(balance) : 'متوازن'}
                      </div>
                      <div class="balance-label">الرصيد الحالي</div>
                    </div>
                  </div>
                  
                  <div class="teacher-content">
                    ${teacherOperations.length > 0 ? `
                      <div class="section-title">📋 العمليات (${teacherOperations.length})</div>
                      <div class="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>التاريخ</th>
                              <th>النوع</th>
                              <th>الكمية</th>
                              <th>السعر</th>
                              <th>الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${teacherOperations.map((op, i) => `
                              <tr>
                                <td>${i + 1}</td>
                                <td>${formatDate(op.operationDate) || 'غير محدد'}</td>
                                <td>${op.type || 'غير محدد'}</td>
                                <td>${op.quantity || 0}</td>
                                <td>${formatCurrency(op.price || 0)}</td>
                                <td><strong>${formatCurrency(op.amount || 0)}</strong></td>
                              </tr>
                            `).join('')}
                          </tbody>
                          <tfoot>
                            <tr class="totals-row">
                              <td colspan="5"><strong>إجمالي العمليات</strong></td>
                              <td><strong>${formatCurrency(totalOperations)}</strong></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ` : ''}

                    ${teacherPayments.length > 0 ? `
                      <div class="section-title">💰 المدفوعات (${teacherPayments.length})</div>
                      <div class="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>التاريخ</th>
                              <th>طريقة الدفع</th>
                              <th>المبلغ</th>
                              <th>ملاحظات</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${teacherPayments.map((payment, i) => `
                              <tr>
                                <td>${i + 1}</td>
                                <td>${formatDate(payment.paymentDate) || 'غير محدد'}</td>
                                <td>${payment.paymentMethod || 'غير محدد'}</td>
                                <td><strong>${formatCurrency(payment.amount || 0)}</strong></td>
                                <td>${payment.notes || '-'}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                          <tfoot>
                            <tr class="totals-row">
                              <td colspan="4"><strong>إجمالي المدفوعات</strong></td>
                              <td><strong>${formatCurrency(totalPayments)}</strong></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ` : ''}

                    ${teacherOperations.length === 0 && teacherPayments.length === 0 ? `
                      <div class="empty-message">
                        <div class="empty-icon">📊</div>
                        <div>لا توجد بيانات لهذا المدرس في الفترة المحددة</div>
                      </div>
                    ` : ''}

                    <div class="balance-summary">
                      <div class="balance-item">
                        <div class="balance-item-label">إجمالي العمليات</div>
                        <div class="balance-item-value">${formatCurrency(totalOperations)}</div>
                      </div>
                      <div class="balance-item">
                        <div class="balance-item-label">إجمالي المدفوعات</div>
                        <div class="balance-item-value">${formatCurrency(totalPayments)}</div>
                      </div>
                      <div class="balance-item">
                        <div class="balance-item-label">الرصيد النهائي</div>
                        <div class="balance-item-value ${balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral'}">
                          ${balance > 0 ? `${formatCurrency(balance)} (مستحق)` : 
                            balance < 0 ? `${formatCurrency(Math.abs(balance))} (رصيد إضافي)` : 
                            'متوازن'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('') : ''}

            <div class="final-summary">
              <div class="summary-title">📊 الملخص النهائي للتقرير</div>
              
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-item-value">${formatCurrency(metadata.totalAmount)}</div>
                  <div class="summary-item-label">إجمالي العمليات</div>
                </div>
                <div class="summary-item">
                  <div class="summary-item-value">${formatCurrency(metadata.totalPaid)}</div>
                  <div class="summary-item-label">إجمالي المدفوعات</div>
                </div>
                <div class="summary-item">
                  <div class="summary-item-value ${(metadata.totalAmount - metadata.totalPaid) > 0 ? 'positive' : 'negative'}">${formatCurrency(metadata.totalAmount - metadata.totalPaid)}</div>
                  <div class="summary-item-label">الرصيد الإجمالي</div>
                </div>
                ${shouldShowExpenses() && metadata.totalExpensesAmount > 0 ? `
                  <div class="summary-item">
                    <div class="summary-item-value" style="color: #e74c3c;">${formatCurrency(metadata.totalExpensesAmount)}</div>
                    <div class="summary-item-label">إجمالي المصروفات</div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <script>
            function printDocument() {
              window.print();
            }
            
            document.addEventListener('keydown', function(e) {
              if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                printDocument();
              }
            });
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      if (onDownloadPDF) {
        onDownloadPDF();
      }
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
      alert('حدث خطأ في إنشاء التقرير. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">📋 معاينة التقرير</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {data.teachers?.length || 0} مدرس • {data.operations?.length || 0} عملية • {data.payments?.length || 0} دفعة
              {shouldShowExpenses() && data.expenses?.length > 0 && ` • ${data.expenses.length} مصروف`}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={generateAndShowHTML}
              disabled={isPrinting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
            >
              <FiFileText size={18} />
              <span>{isPrinting ? 'جاري التحضير...' : 'عرض وطباعة التقرير'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiX size={18} />
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-8 pb-8 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
            📊
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{config.title}</h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">تاريخ الإنشاء: {formatDate(metadata.generatedAt)} | المستخدم: {metadata.generatedBy}</p>
            <p>الفترة: {config.dateRange?.from ? formatDate(config.dateRange.from) : 'غير محدد'} - {config.dateRange?.to ? formatDate(config.dateRange.to) : 'غير محدد'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{metadata.totalTeachers}</div>
              <div className="text-sm opacity-90">مدرس</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{metadata.totalOperations}</div>
              <div className="text-sm opacity-90">عملية</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{formatCurrency(metadata.totalAmount)}</div>
              <div className="text-sm opacity-90">إجمالي المبلغ</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{formatCurrency(metadata.totalPaid)}</div>
              <div className="text-sm opacity-90">إجمالي المدفوعات</div>
            </div>
          </div>
        </div>

        {/* عرض معلومات المصروفات فقط إذا كانت مطلوبة */}
        {shouldShowExpenses() && metadata.totalExpenses > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{metadata.totalExpenses}</div>
                <div className="text-sm opacity-90">مصروفات خاصة</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{formatCurrency(metadata.totalExpensesAmount || 0)}</div>
                <div className="text-sm opacity-90">إجمالي المصروفات</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">معاينة التقرير</h3>
          <p className="text-gray-600 mb-8">
            انقر على "عرض وطباعة التقرير" أعلاه لمشاهدة التقرير كاملاً مع إمكانية الطباعة
          </p>
          
          {/* عرض ملخص المحتوى */}
          <div className="bg-blue-50 rounded-xl p-6 max-w-2xl mx-auto">
            <h4 className="font-bold text-blue-900 mb-4">محتويات التقرير:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              {data.teachers && data.teachers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span>{data.teachers.length} مدرس مع تفاصيلهم</span>
                </div>
              )}
              {data.operations && data.operations.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <span>{data.operations.length} عملية مسجلة</span>
                </div>
              )}
              {data.payments && data.payments.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span>{data.payments.length} دفعة مسجلة</span>
                </div>
              )}
              {shouldShowExpenses() && data.expenses && data.expenses.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>🧾</span>
                  <span>{data.expenses.length} مصروف خاص</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>📊</span>
                <span>ملخص مالي شامل</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📈</span>
                <span>إحصائيات مفصلة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;