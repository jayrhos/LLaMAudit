import { Router, Request, Response } from 'express';
import { isValidPdf, extractTextFromPdf } from '../services/pdfExtractor';

const router = Router();

/**
 * POST /api/pdf/extract
 * Extract text from a PDF file
 * 
 * Request: multipart/form-data with 'file' field
 * Response: { text: string, pageCount: number, metadata?: object }
 */
router.post('/extract', async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded (multer puts it in req.file)
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const buffer = req.file.buffer;
    
    // Validate file buffer
    if (!Buffer.isBuffer(buffer)) {
      return res.status(400).json({ error: 'Invalid file data' });
    }

    // Validate PDF magic bytes
    if (!isValidPdf(buffer)) {
      return res.status(400).json({ error: 'Invalid PDF file format' });
    }

    console.log(`[pdf] Extracting text from PDF (${buffer.length} bytes)`);

    // Extract text
    const result = await extractTextFromPdf(buffer);

    console.log(`[pdf] Extraction complete: ${result.pageCount} pages, ${result.text.length} chars`);

    res.json({
      text: result.text,
      pageCount: result.pageCount,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('[pdf] Extraction error:', error?.message || error);
    
    // Handle specific error cases
    if (error?.message?.includes('password')) {
      return res.status(400).json({ error: 'PDF is password-protected and cannot be processed' });
    }
    
    if (error?.message?.includes('corrupt') || error?.message?.includes('invalid')) {
      return res.status(400).json({ error: 'PDF file is corrupt or invalid' });
    }

    res.status(500).json({ error: error.message || 'Failed to extract text from PDF' });
  }
});

export default router;
