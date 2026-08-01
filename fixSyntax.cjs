const fs = require('fs');
const path = require('path');

const fixTernaryBraces = (file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  content = content.replace(/\? \{formatCurrency\(([^)]+)\)\}/g, '? formatCurrency($1)');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed ternary in ${file}`);
  }
};

const fixRechartsImports = (file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  
  if (content.includes('import {\nimport { useSettings')) {
    content = content.replace("import {\nimport { useSettings } from '../../features/settings/hooks/useSettings';\nimport { formatCurrency } from '../../utils/currency';", "import { useSettings } from '../../features/settings/hooks/useSettings';\nimport { formatCurrency } from '../../utils/currency';\nimport {");
  }
  
  content = content.replace(/\(value: any\) => \{formatCurrency\(([^)]+)\)\}/g, '(value: any) => formatCurrency($1)');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed recharts in ${file}`);
  }
};

const files = [
  'src/features/cashbook/components/CashbookList.tsx',
  'src/features/vendors/components/VendorLedger.tsx',
  'src/features/clients/components/ClientLedger.tsx'
];

files.forEach(fixTernaryBraces);

const chartFiles = [
  'src/features/reports/components/CashFlowChart.tsx',
  'src/features/reports/components/ExpenseBreakdownChart.tsx'
];

chartFiles.forEach(fixRechartsImports);
