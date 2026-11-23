export async function toCanvas(node: HTMLElement, options?: any): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = options?.width || node.offsetWidth || 794;
  canvas.height = options?.height || node.offsetHeight || 1123;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = options?.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

export async function toPng(): Promise<string> {
  return '';
}

export async function toJpeg(): Promise<string> {
  return '';
}

export async function toBlob(): Promise<Blob | null> {
  return null;
}
