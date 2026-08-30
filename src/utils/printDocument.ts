/**
 * Print only the bill document from a blank iframe so the browser
 * header/footer does not show the app web address.
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
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = iframe.contentDocument ?? frameWindow?.document;

  if (!frameWindow || !frameDoc) {
    iframe.remove();
    window.print();
    return;
  }

  const headStyles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((node) => node.outerHTML)
    .join('\n');

  const clone = source.cloneNode(true) as HTMLElement;
  // Avoid printing internal app routes after link text
  clone.querySelectorAll('a[href]').forEach((anchor) => {
    const span = document.createElement('span');
    span.innerHTML = (anchor as HTMLElement).innerHTML;
    span.className = anchor.className;
    anchor.replaceWith(span);
  });

  const title = options?.title ?? document.title;

  frameDoc.open();
  frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  ${headStyles}
  <style>
    html, body {
      background: #fff !important;
      color: #000 !important;
      margin: 0 !important;
      padding: 16px !important;
    }
    .MuiPaper-root,
    .MuiTableContainer-root,
    .MuiTableCell-root,
    .MuiTypography-root {
      background-color: #fff !important;
      color: #000 !important;
      box-shadow: none !important;
    }
    a { color: #000 !important; text-decoration: none !important; }
    a[href]::after { content: none !important; }
    .MuiTableHead-root { background-color: #f0f0f0 !important; }
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { margin: 12mm; }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`);
  frameDoc.close();

  const cleanup = () => {
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
      // Delay removal so the print dialog can read the frame
      setTimeout(cleanup, 1000);
    }
  };

  // Wait for stylesheet/images, then print
  const images = Array.from(frameDoc.images);
  const pending = images.filter((img) => !img.complete);

  if (pending.length === 0) {
    setTimeout(runPrint, 150);
  } else {
    let left = pending.length;
    const done = () => {
      left -= 1;
      if (left <= 0) setTimeout(runPrint, 150);
    };
    pending.forEach((img) => {
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    });
    // Safety timeout
    setTimeout(runPrint, 2000);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
