declare module 'html-to-image' {
  export function toCanvas(node: HTMLElement, options?: any): Promise<HTMLCanvasElement>;
  export function toPng(node: HTMLElement, options?: any): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: any): Promise<string>;
  export function toBlob(node: HTMLElement, options?: any): Promise<Blob | null>;
  export function toPixelData(node: HTMLElement, options?: any): Promise<Uint8ClampedArray>;
  export function toSvg(node: HTMLElement, options?: any): Promise<string>;
}

declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any);
    addImage(imageData: any, format: string, x: number, y: number, width: number, height: number, alias?: string, compression?: any, rotation?: number): any;
    addPage(format?: any, orientation?: any): any;
    save(filename?: string, options?: any): any;
    output(type?: string, options?: any): any;
    internal: any;
  }
}
