import pdfParse from 'pdf-parse';

// Common PDF ligatures and their expansions
const LIGATURE_MAP: Record<string, string> = {
  '\uFB01': 'fi',  // ﬁ
  '\uFB02': 'fl',  // ﬂ
  '\uFB03': 'ffi', // ﬃ
  '\uFB04': 'ffl', // ﬄ
  '\uFB05': 'st',  // ﬅ
  '\uFB06': 'st',  // ﬆ
  '\u0132': 'IJ',  // Ĳ (Dutch ligature)
  '\u0133': 'ij',  // ĳ
  '\u0152': 'OE',  // Œ
  '\u0153': 'oe',  // œ
  '\u00C6': 'AE',  // Æ
  '\u00E6': 'ae',  // æ
};

const LIGATURE_REGEX = new RegExp(Object.keys(LIGATURE_MAP).join('|'), 'g');

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  metadata?: Record<string, any>;
}

/**
 * Extract text from a PDF buffer
 * Handles ligature expansion automatically
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    const pdfData = await pdfParse(buffer);
    
    // Expand ligatures in the extracted text
    const expandedText = expandLigatures(pdfData.text);
    
    return {
      text: expandedText,
      pageCount: pdfData.numpages,
      metadata: pdfData.info,
    };
  } catch (error: any) {
    console.error('[pdfExtractor] Failed to extract text:', error?.message || error);
    throw new Error(`PDF extraction failed: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Expand ligatures in text extracted from PDF
 */
export function expandLigatures(text: string): string {
  return text.replace(LIGATURE_REGEX, (match) => LIGATURE_MAP[match] || match);
}

/**
 * Validate if a buffer is a valid PDF file
 * Checks for PDF magic bytes: %PDF-
 */
export function isValidPdf(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) {
    return false;
  }
  
  // PDF files start with %PDF-
  const header = buffer.slice(0, 5).toString('ascii');
  return header === '%PDF-';
}
