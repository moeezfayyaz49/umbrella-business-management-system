const fs = require('fs');
const path = require('path');

const filesToProcess = [
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
];

filesToProcess.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  // 1. Add imports if they don't exist
  if (!content.includes('useSettings')) {
    // Find depth to reach root src
    const depth = file.split('/').length - 2; // -1 for filename, -1 for src
    const relativePath = '../'.repeat(depth - 1);
    const importSettings = `import { useSettings } from '${relativePath}features/settings/hooks/useSettings';\n`;
    const importFormat = `import { formatCurrency } from '${relativePath}utils/currency';\n`;
    
    // insert after the last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfLastImport + 1) + importSettings + importFormat + content.slice(endOfLastImport + 1);
  }

  // 2. Add useSettings hook inside component
  // Regex to find component declaration
  const componentMatch = content.match(/export const (\w+) = \([^)]*\) => {/);
  if (componentMatch && !content.includes('const { data: settings } = useSettings();')) {
    const componentName = componentMatch[1];
    content = content.replace(
      new RegExp(`(export const ${componentName} = \\([^)]*\\) => {)`),
      `$1\n  const { data: settings } = useSettings();`
    );
  }

  // 3. Replacements
  // e.g. `$${vendor.opening_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  // -> `{formatCurrency(vendor.opening_balance, settings?.currency)}`
  
  // Replace Template literal $${var.toLocaleString(...)}
  content = content.replace(/`\$?\$\{([^}]+)\.toLocaleString\([^)]*\)\}`/g, (match, p1) => {
    return `{formatCurrency(${p1}, settings?.currency)}`;
  });
  
  // Replace JSX ${\{var.toLocaleString(...)\}} (wait, JSX string `$` is outside the braces)
  content = content.replace(/\$\{([^}]+)\.toLocaleString\([^)]*\)\}/g, (match, p1) => {
    return `{formatCurrency(${p1}, settings?.currency)}`;
  });
  
  // Sometimes it's inside text: >${var.toLocaleString()}<
  content = content.replace(/>\$(\{([^}]+)\.toLocaleString\([^)]*\)\})</g, (match, p1, p2) => {
    return `>{formatCurrency(${p2}, settings?.currency)}<`;
  });

  // Recharts formatters: (value: any) => `$${Number(value).toLocaleString()}`
  content = content.replace(/`\$?\$\{Number\(([^)]+)\)\.toLocaleString\(\)\}`/g, (match, p1) => {
    return `formatCurrency(${p1}, settings?.currency)`;
  });

  // Replace .toFixed(2) in Purchases
  content = content.replace(/>\$(\{([^}]+)\.toFixed\(2\)\})</g, (match, p1, p2) => {
    return `>{formatCurrency(${p2}, settings?.currency)}<`;
  });
  
  // Replace -$ prefix for discount in Purchases
  content = content.replace(/>-\$(\{([^}]+)\.toFixed\(2\)\})</g, (match, p1, p2) => {
    return `>-{formatCurrency(${p2}, settings?.currency)}<`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
