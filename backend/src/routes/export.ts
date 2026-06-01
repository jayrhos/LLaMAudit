import { Router, Request, Response } from 'express';
import { Analysis } from '../models';
import { generatePdfReport, generateHtmlReport } from '../services/pdfReportGenerator';

const router = Router();

/**
 * GET /api/export/analysis/:id/pdf
 * Export analysis results as PDF report
 * Query param: inline=true to display in browser instead of download
 */
router.get('/analysis/:id/pdf', async (req: Request, res: Response) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (analysis.status !== 'completed') {
      return res.status(400).json({ error: 'Analysis is not complete' });
    }

    console.log(`[pdf-export] Generating PDF report for analysis ${req.params.id}`);

    // Prepare report data
    const reportData = {
      title: analysis.title,
      overallScore: analysis.overallScore,
      summary: analysis.summary,
      inputText: analysis.inputText,
      sections: analysis.sections as any[],
      models: analysis.models as string[],
      provider: analysis.provider,
      createdAt: analysis.createdAt.toISOString(),
    };

    // Generate PDF
    const pdfBuffer = await generatePdfReport(reportData);

    // Set response headers - avoid charset for binary PDF data
    res.setHeader('Content-Type', 'application/pdf');
    
    // Check if inline view requested
    if (req.query.inline === 'true') {
      res.setHeader('Content-Disposition', `inline; filename="llamaudit-report-${analysis.id.slice(0, 8)}.pdf"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="llamaudit-report-${analysis.id.slice(0, 8)}.pdf"`);
    }
    
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    console.log(`[pdf-export] PDF generated successfully (${pdfBuffer.length} bytes)`);

    // Use res.end() to send raw binary data - res.send() would JSON-serialize the Buffer
    res.end(pdfBuffer);
  } catch (error: any) {
    console.error('[pdf-export] Error generating PDF:', error?.message || error);
    res.status(500).json({ error: error.message || 'Failed to generate PDF report' });
  }
});

/**
 * GET /api/export/analysis/:id/html
 * Export analysis results as HTML report
 * Query param: inline=true to display in browser instead of download
 */
router.get('/analysis/:id/html', async (req: Request, res: Response) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (analysis.status !== 'completed') {
      return res.status(400).json({ error: 'Analysis is not complete' });
    }

    console.log(`[html-export] Generating HTML report for analysis ${req.params.id}`);

    // Prepare report data
    const reportData = {
      title: analysis.title,
      overallScore: analysis.overallScore,
      summary: analysis.summary,
      inputText: analysis.inputText,
      sections: analysis.sections as any[],
      models: analysis.models as string[],
      provider: analysis.provider,
      createdAt: analysis.createdAt.toISOString(),
    };

    // Generate HTML
    const html = generateHtmlReport(reportData);

    // Set response headers
    res.setHeader('Content-Type', 'text/html');
    
    // Check if inline view requested
    if (req.query.inline === 'true') {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="llamaudit-report-${analysis.id.slice(0, 8)}.html"`);
    }

    console.log(`[html-export] HTML generated successfully (${html.length} bytes)`);

    res.send(html);
  } catch (error: any) {
    console.error('[html-export] Error generating HTML:', error?.message || error);
    res.status(500).json({ error: error.message || 'Failed to generate HTML report' });
  }
});

export default router;
