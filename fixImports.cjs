const fs = require('fs');
const path = require('path');

const fixFile = (file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Fix path '../../features/settings' -> '../../settings'
  // Or '.../.../features/settings' -> '.../.../settings'
  content = content.replace(/from '([^']+)features\/settings\/hooks\/useSettings'/g, (match, prefix) => {
    // If the prefix has enough '../' to get to src/, we want to add 'features/'
    // Wait, let's just make them all absolute relative to src to be safe? Or just use regex to fix it.
    return `from '${prefix.endsWith('features/') ? prefix : prefix + 'features/'}settings/hooks/useSettings'`;
  });
  
  // Actually, wait. The depth logic in my first script:
  // src/features/cashbook/components/CashbookList.tsx -> depth 4 -> 4-2 = 2 => '../../'
  // My first script inserted: `import ... from '../../features/settings...'`
  // So it resolves to `src/features/features/settings`.
  content = content.replace(/\.\.\/\.\.\/features\/settings\//g, '../../settings/');
  content = content.replace(/\.\.\/\.\.\/utils\/currency/g, '../../../utils/currency');
  
  // DashboardMetricCard:
  // depth: src/features/dashboard/components/ -> '../../'
  // Wait, currency path: ../../../utils/currency
  content = content.replace(/\.\.\/\.\.\/utils\/currency/g, '../../../utils/currency'); // Already did

  // Check InvoiceView.tsx mb={2} issue
  content = content.replace(/<Box mb=\{2\}>/g, '<Box sx={{ mb: 2 }}>');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed paths in ${file}`);
  }
};

const files = [
  'src/features/cashbook/components/CashbookList.tsx',
  'src/features/expenses/components/ExpenseList.tsx',
  'src/features/dashboard/components/DashboardMetricCard.tsx',
  'src/features/dashboard/components/RecentTransactionsTable.tsx',
  'src/features/purchases/components/PurchaseList.tsx',
  'src/features/purchases/components/PurchaseForm.tsx',
  'src/features/purchases/components/PurchaseView.tsx',
  'src/features/reports/components/CashFlowChart.tsx',
  'src/features/reports/components/ExpenseBreakdownChart.tsx',
  'src/features/reports/components/ProfitLossSummary.tsx',
  'src/features/vendors/components/VendorList.tsx',
  'src/features/vendors/components/VendorLedger.tsx',
  'src/features/clients/components/ClientList.tsx',
  'src/features/clients/components/ClientLedger.tsx',
  'src/features/invoices/components/InvoiceList.tsx',
  'src/features/invoices/components/InvoiceView.tsx'
];

files.forEach(fixFile);
