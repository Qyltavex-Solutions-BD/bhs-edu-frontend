'use client';

import { toCanvas } from '@/src/lib/shims/html-to-image';
import { jsPDF } from '@/src/lib/shims/jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_MARGIN_MM = 8;
const A4_CONTENT_WIDTH_MM = A4_WIDTH_MM - A4_MARGIN_MM * 2; // 194mm
const A4_CONTENT_HEIGHT_MM = A4_HEIGHT_MM - A4_MARGIN_MM * 2; // 281mm
const A4_CAPTURE_WIDTH_PX = 794; // 210mm at 96dpi

/**
 * Converts same-origin relative/absolute image URLs to inline data URLs on the cloned DOM
 * so SVG <foreignObject> rendering in html-to-image never drops logos or watermarks.
 */
async function inlineCloneImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const rawSrc = img.getAttribute('src');
      if (!rawSrc || rawSrc.startsWith('data:') || rawSrc.startsWith('blob:')) {
        try {
          if (!img.complete) {
            await new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            });
          }
          if (typeof img.decode === 'function') {
            await img.decode().catch(() => {});
          }
        } catch {
          // Ignore individual decode errors
        }
        return;
      }

      try {
        const resolvedUrl = rawSrc.startsWith('/')
          ? `${window.location.origin}${rawSrc}`
          : rawSrc;
        const response = await fetch(resolvedUrl, { mode: 'cors', credentials: 'same-origin' });
        if (!response.ok) return;
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(blob);
        });
        img.setAttribute('src', dataUrl);
        if (typeof img.decode === 'function') {
          await img.decode().catch(() => {});
        }
      } catch {
        // Keep original src if CORS prevents inlining
      }
    })
  );
}

/**
 * Generates and downloads a true, print-grade A4 PDF file from an official document DOM node.
 * Uses browser-native SVG <foreignObject> rendering (via html-to-image) so Bengali conjuncts
 * (যুক্তবর্ণ), Noto Sans Bengali typography, double borders, watermarks, and CSS Grids match
 * the screen & A4 print preview with 100% fidelity.
 */
export async function exportNodeToA4Pdf(
  sourceNode: HTMLElement | null,
  filename: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !sourceNode) return false;

  // Prefer the inner A4 paper element if a wrapper was passed
  const paperNode =
    (sourceNode.matches('.certificate-paper')
      ? sourceNode
      : sourceNode.querySelector<HTMLElement>('.certificate-paper')) ?? sourceNode;

  // Wait for self-hosted Noto Sans Bengali & Plus Jakarta Sans fonts
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch {
    // Proceed even if fonts API fails
  }

  // Mount an isolated, light-mode, fixed-794px A4 staging host inside a 0x0 overflow-hidden
  // wrapper at (0, 0) so narrow mobile viewports or dark mode never distort the PDF structure
  // and browsers always rasterize fonts & images cleanly inside SVG <foreignObject>.
  const stage = document.createElement('div');
  stage.setAttribute('aria-hidden', 'true');
  stage.style.position = 'fixed';
  stage.style.left = '0';
  stage.style.top = '0';
  stage.style.width = '0';
  stage.style.height = '0';
  stage.style.overflow = 'hidden';
  stage.style.pointerEvents = 'none';
  stage.style.zIndex = '-9999';
  stage.className = 'light';

  const host = document.createElement('div');
  host.style.width = `${A4_CAPTURE_WIDTH_PX}px`;
  host.style.background = '#FFFFFF';
  host.style.color = '#111111';
  host.style.padding = '0';
  host.style.margin = '0';

  const clone = paperNode.cloneNode(true) as HTMLElement;
  clone.removeAttribute('data-certificate-print-root');
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());

  // Normalize outer paper frame for crisp PDF margins (keep inner double border intact!)
  clone.style.width = `${A4_CAPTURE_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_CAPTURE_WIDTH_PX}px`;
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.background = '#FFFFFF';
  clone.style.color = '#111111';

  host.appendChild(clone);
  stage.appendChild(host);
  document.body.appendChild(stage);

  try {
    await inlineCloneImages(clone);
    // Allow 2 animation frames for layout and decoded images to settle cleanly
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    const captureHeight = Math.ceil(clone.scrollHeight || clone.getBoundingClientRect().height);

    let canvas: HTMLCanvasElement;
    try {
      canvas = await toCanvas(clone, {
        width: A4_CAPTURE_WIDTH_PX,
        height: captureHeight,
        pixelRatio: 2.25,
        backgroundColor: '#FFFFFF',
        cacheBust: false,
        preferredFontFormat: 'woff2',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });
    } catch {
      // Safe fallback if a third-party stylesheet blocks font reading
      canvas = await toCanvas(clone, {
        width: A4_CAPTURE_WIDTH_PX,
        height: captureHeight,
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        cacheBust: false,
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidthMm = A4_CONTENT_WIDTH_MM;
    const imgHeightMm = (canvas.height / canvas.width) * imgWidthMm;

    if (imgHeightMm <= A4_CONTENT_HEIGHT_MM) {
      // Fits naturally on 1 crisp A4 page with uniform 8mm margins
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', A4_MARGIN_MM, A4_MARGIN_MM, imgWidthMm, imgHeightMm, undefined, 'FAST');
    } else if (imgHeightMm <= A4_CONTENT_HEIGHT_MM * 1.42) {
      // Slightly taller than 1 A4 page (e.g., full Bangla typography + Class 9/10 + TC + Legal Guardian):
      // Scale proportionally to keep the entire double-bordered institutional form intact on 1 A4 page!
      const fitHeightMm = A4_CONTENT_HEIGHT_MM;
      const fitWidthMm = (canvas.width / canvas.height) * fitHeightMm;
      const offsetX = (A4_WIDTH_MM - fitWidthMm) / 2;
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', offsetX, A4_MARGIN_MM, fitWidthMm, fitHeightMm, undefined, 'FAST');
    } else {
      // Genuinely multi-page document: cleanly slice canvas per A4 content height
      const pxPerMm = canvas.width / A4_CONTENT_WIDTH_MM;
      const pageSliceHeightPx = Math.floor(A4_CONTENT_HEIGHT_MM * pxPerMm);
      let renderedPx = 0;
      let pageIndex = 0;

      while (renderedPx < canvas.height) {
        const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - renderedPx);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedPx,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );
          if (pageIndex > 0) pdf.addPage();
          const sliceHeightMm = sliceHeightPx / pxPerMm;
          pdf.addImage(
            pageCanvas.toDataURL('image/png'),
            'PNG',
            A4_MARGIN_MM,
            A4_MARGIN_MM,
            A4_CONTENT_WIDTH_MM,
            sliceHeightMm,
            undefined,
            'FAST'
          );
        }
        renderedPx += sliceHeightPx;
        pageIndex += 1;
      }
    }

    const safeName = filename
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const finalName = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;
    pdf.save(finalName);
    return true;
  } finally {
    stage.remove();
  }
}
