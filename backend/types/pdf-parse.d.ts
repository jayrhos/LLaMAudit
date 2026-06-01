declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Producer?: string;
    Creator?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata?: string;
    text: string;
    version: string;
  }

  function pdfParse(data: Buffer, options?: any): Promise<PDFData>;
  export default pdfParse;
}
