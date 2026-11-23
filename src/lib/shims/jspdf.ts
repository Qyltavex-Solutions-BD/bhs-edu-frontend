export class jsPDF {
  constructor(_options?: any) {}
  addImage(..._args: any[]) {
    return this;
  }
  addPage(..._args: any[]) {
    return this;
  }
  save(_filename?: string) {
    if (typeof window !== 'undefined') {
      window.print();
    }
    return this;
  }
  output(..._args: any[]) {
    return null;
  }
}
