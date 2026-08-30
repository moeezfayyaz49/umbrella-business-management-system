/**
 * Print only the bill document from an off-screen iframe so the browser
 * header/footer does not show the app web address, while keeping layout readable.
 */
export function printDocument(options?: { title?: string; selector?: string }) {
  const selector = options?.selector ?? '.print-area';
  const source = document.querySelector(selector);

  if (!source) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'print-frame');
  // Real page size is required — zero-size frames print broken / unreadable layouts
  iframe.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:8.5in',
    'height:11in',
    'border:0',
    'opacity:0',
    'pointer-events:none',
    'z-index:-1',
  ].join(';');
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = iframe.contentDocument ?? frameWindow?.document;

  if (!frameWindow || !frameDoc) {
    iframe.remove();
    window.print();
    return;
  }

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('a[href]').forEach((anchor) => {
    const span = document.createElement('span');
    span.innerHTML = (anchor as HTMLElement).innerHTML;
    span.className = anchor.className;
    anchor.replaceWith(span);
  });

  const title = options?.title ?? document.title;
  const previousTitle = document.title;
  document.title = title;

  const collectedCss = collectDocumentCss();

  frameDoc.open();
  frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${collectedCss}</style>
  <style>${PRINT_BILL_CSS}</style>
</head>
<body class="print-bill-body">${clone.outerHTML}</body>
</html>`);
  frameDoc.close();

  const cleanup = () => {
    document.title = previousTitle;
    iframe.remove();
  };

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      setTimeout(cleanup, 1000);
    }
  };

  const images = Array.from(frameDoc.images);
  const pending = images.filter((img) => !img.complete);

  if (pending.length === 0) {
    // Allow layout/paint before opening the dialog
    requestAnimationFrame(() => setTimeout(runPrint, 250));
  } else {
    let left = pending.length;
    const done = () => {
      left -= 1;
      if (left <= 0) requestAnimationFrame(() => setTimeout(runPrint, 250));
    };
    pending.forEach((img) => {
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    });
    setTimeout(runPrint, 2500);
  }
}

function collectDocumentCss(): string {
  const chunks: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules || [])
        .map((rule) => rule.cssText)
        .join('\n');
      if (rules) chunks.push(rules);
    } catch {
      // Cross-origin sheets cannot be read; keep a link import when possible
      if (sheet.href) {
        chunks.push(`@import url("${sheet.href}");`);
      }
    }
  }

  return chunks.join('\n');
}

/** Self-contained bill layout so print stays readable even if theme CSS is incomplete */
const PRINT_BILL_CSS = `
  @page {
    margin: 12mm;
    size: auto;
  }

  html, body.print-bill-body {
    background: #fff !important;
    color: #000 !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 11pt !important;
    line-height: 1.4 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-area,
  .MuiPaper-root {
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 8mm !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Bill header / party / totals rows (MUI Box + sx flex) */
  .print-area > .MuiBox-root {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 16px !important;
    margin-bottom: 20px !important;
    flex-wrap: nowrap !important;
  }

  .print-area > .MuiBox-root > .MuiBox-root {
    display: block !important;
    min-width: 0 !important;
  }

  .print-area > .MuiTableContainer-root + .MuiBox-root,
  .print-area > .MuiBox-root:last-child {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 24px !important;
    flex-wrap: wrap !important;
    margin-bottom: 0 !important;
  }

  .MuiTypography-root,
  .MuiTableCell-root,
  a,
  span,
  p {
    color: #000 !important;
  }

  .MuiTypography-h4 {
    font-size: 22pt !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    margin: 0 0 4px 0 !important;
  }

  .MuiTypography-h6 {
    font-size: 13pt !important;
    font-weight: 600 !important;
    line-height: 1.3 !important;
    margin: 0 0 2px 0 !important;
  }

  .MuiTypography-body1 {
    font-size: 11pt !important;
  }

  .MuiTypography-body2,
  .MuiTypography-caption,
  .MuiTypography-subtitle2 {
    font-size: 10pt !important;
  }

  .MuiTypography-subtitle2 {
    font-weight: 600 !important;
    letter-spacing: 0.02em !important;
    margin-bottom: 4px !important;
  }

  img {
    max-height: 70px !important;
    max-width: 180px !important;
    object-fit: contain !important;
  }

  .MuiTableContainer-root {
    width: 100% !important;
    overflow: visible !important;
    margin: 16px 0 !important;
  }

  .MuiTable-root {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  .MuiTableCell-root {
    border-bottom: 1px solid #ccc !important;
    padding: 8px 10px !important;
    font-size: 10.5pt !important;
    vertical-align: top !important;
    background: #fff !important;
  }

  .MuiTableHead-root .MuiTableCell-root {
    background: #f0f0f0 !important;
    font-weight: 700 !important;
    border-bottom: 1px solid #999 !important;
  }

  .MuiDivider-root {
    border-color: #999 !important;
    margin: 8px 0 !important;
  }

  a {
    text-decoration: none !important;
  }

  a[href]::after {
    content: none !important;
  }

  /* Keep totals block from collapsing awkwardly */
  .MuiPaper-root .MuiPaper-root {
    border: 1px solid #ccc !important;
    padding: 10px !important;
    background: #fafafa !important;
  }
`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
