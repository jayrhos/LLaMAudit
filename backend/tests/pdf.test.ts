import { isValidPdf, expandLigatures } from '../src/services/pdfExtractor';

describe('PDF Extractor', () => {
  describe('isValidPdf', () => {
    it('should validate PDF magic bytes', () => {
      // Valid PDF header
      const validPdf = Buffer.from('%PDF-1.4\n...');
      expect(isValidPdf(validPdf)).toBe(true);
    });

    it('should reject non-PDF files', () => {
      // Not a PDF
      const notPdf = Buffer.from('This is not a PDF');
      expect(isValidPdf(notPdf)).toBe(false);
    });

    it('should reject empty buffers', () => {
      expect(isValidPdf(Buffer.alloc(0))).toBe(false);
    });

    it('should reject short buffers', () => {
      expect(isValidPdf(Buffer.from('%PDF'))).toBe(false);
    });

    it('should reject files with wrong header', () => {
      const wrongHeader = Buffer.from('%PDF1');
      expect(isValidPdf(wrongHeader)).toBe(false);
    });
  });

  describe('expandLigatures', () => {
    it('should expand common ligatures', () => {
      const text = 'This is a ﬁle with ﬂ ligatures';
      const expanded = expandLigatures(text);
      expect(expanded).toBe('This is a file with fl ligatures');
    });

    it('should expand ffi and ffl ligatures', () => {
      const text = 'The oﬃce has aﬄuent residents';
      const expanded = expandLigatures(text);
      expect(expanded).toBe('The office has affluent residents');
    });

    it('should expand st ligatures', () => {
      const text = 'The ﬅory was ﬆill untold';
      const expanded = expandLigatures(text);
      expect(expanded).toBe('The story was still untold');
    });

    it('should expand AE and OE ligatures', () => {
      const text = 'The æsthetic was Œdipal';
      const expanded = expandLigatures(text);
      expect(expanded).toBe('The aesthetic was OEdipal');
    });

    it('should expand Dutch IJ ligature', () => {
      const text = 'Het Ĳsselmeer is groot';
      const expanded = expandLigatures(text);
      expect(expanded).toBe('Het IJsselmeer is groot');
    });

    it('should handle multiple ligatures in one text', () => {
      const text = 'The ﬁnal ﬂight oﬃcially ﬆarted';
      const expanded = expandLigatures(text);
      expect(expanded).toBe('The final flight officially started');
    });

    it('should handle text without ligatures', () => {
      const text = 'Normal text without ligatures';
      const expanded = expandLigatures(text);
      expect(expanded).toBe('Normal text without ligatures');
    });

    it('should handle empty string', () => {
      expect(expandLigatures('')).toBe('');
    });
  });
});
