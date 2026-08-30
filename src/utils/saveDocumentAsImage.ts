import html2canvas from 'html2canvas';

/**
 * Capture the bill (.print-area) as a PNG and download it.
 * Filename uses the provided title (e.g. invoice / purchase number).
 */
export async function saveDocumentAsImage(options?: {
  title?: string;
  selector?: string;
}): Promise<void> {
  const selector = options?.selector ?? '.print-area';
  const source = document.querySelector(selector) as HTMLElement | null;

  if (!source) {
    throw new Error('Nothing to save as image');
  }

  const filename = sanitizeFilename(options?.title || 'document') + '.png';

  const canvas = await html2canvas(source, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    onclone: (_doc, cloned) => {
      forceLightBillStyles(cloned);
    },
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );

  if (!blob) {
    throw new Error('Failed to create image');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document';
}

/** Ensure dark theme colors do not make the exported image unreadable */
function forceLightBillStyles(root: HTMLElement) {
  root.style.backgroundColor = '#ffffff';
  root.style.color = '#000000';
  root.style.boxShadow = 'none';
  root.style.minHeight = '0';

  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'img') return;

    el.style.color = '#000000';

    const bg = el.style.backgroundColor || '';
    // Keep subtle table header shading; otherwise force white surfaces
    if (el.classList.contains('MuiTableHead-root') || el.closest('.MuiTableHead-root')) {
      el.style.backgroundColor = '#f0f0f0';
    } else if (!bg || bg === 'transparent' || bg.includes('rgba(0, 0, 0')) {
      // leave mostly alone; canvas backgroundColor covers gaps
    } else {
      el.style.backgroundColor = '#ffffff';
    }

    el.style.boxShadow = 'none';
  });
}
