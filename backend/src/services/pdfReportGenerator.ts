import PDFDocument from 'pdfkit';
import { DetectionResult, SectionAnalysis } from './openrouter';

export interface PdfReportData {
  title: string;
  overallScore: number;
  summary: string;
  inputText: string;
  sections: SectionAnalysis[];
  models: string[];
  provider: string;
  createdAt: string;
}

function getScoreLabel(score: number): string {
  if (score >= 0.7) return 'High probability of AI-generated content';
  if (score >= 0.4) return 'Moderate probability of AI-generated content';
  return 'Low probability of AI-generated content';
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return '#ef4444';
  if (score >= 0.4) return '#f59e0b';
  return '#22c55e';
}

export function generateHtmlReport(data: PdfReportData): string {
  const scorePercentage = Math.round(data.overallScore * 100);
  const scoreColor = getScoreColor(data.overallScore);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLaMa Audit Report - ${data.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f9fafb;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { font-size: 28px; color: #111827; text-align: center; margin-bottom: 8px; }
    h2 { font-size: 20px; color: #374151; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .subtitle { text-align: center; color: #6b7280; font-size: 16px; margin-bottom: 32px; }
    .score-section { text-align: center; padding: 32px; background: #f9fafb; border-radius: 8px; margin-bottom: 32px; }
    .score-label { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .score-value { font-size: 48px; font-weight: bold; color: ${scoreColor}; }
    .score-description { font-size: 14px; color: #6b7280; margin-top: 8px; }
    .metadata { background: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 24px; font-size: 13px; }
    .metadata p { margin: 4px 0; }
    .summary { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 0 6px 6px 0; }
    .section-item { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin-bottom: 16px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .section-number { font-weight: 600; color: #374151; }
    .section-score { font-weight: 600; padding: 4px 12px; border-radius: 9999px; font-size: 13px; }
    .section-text { color: #1f2937; margin-bottom: 12px; font-size: 14px; }
    .rationale { color: #6b7280; font-size: 13px; font-style: italic; margin-bottom: 8px; }
    .markers { color: #9ca3af; font-size: 12px; }
    .markers span { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; margin-right: 6px; }
    .high-risk { background: #fee2e2; color: #991b1b; }
    .moderate-risk { background: #fef3c7; color: #92400e; }
    .low-risk { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <div class="container">
    <h1>LLaMa Audit Report</h1>
    <p class="subtitle">${data.title}</p>
    
    <div class="score-section">
      <p class="score-label">Overall AI Detection Score</p>
      <p class="score-value">${scorePercentage}%</p>
      <p class="score-description">${getScoreLabel(data.overallScore)}</p>
    </div>

    <div class="summary">
      <strong>Summary:</strong> ${data.summary}
    </div>

    <div class="metadata">
      <p><strong>Provider:</strong> ${data.provider}</p>
      <p><strong>Models:</strong> ${data.models.join(', ')}</p>
      <p><strong>Generated:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
    </div>

    <h2>Section Analysis</h2>
    ${data.sections.map((section, index) => {
      const prob = Math.round(section.ai_probability * 100);
      const riskClass = section.ai_probability >= 0.7 ? 'high-risk' : section.ai_probability >= 0.4 ? 'moderate-risk' : 'low-risk';
      return `
    <div class="section-item">
      <div class="section-header">
        <span class="section-number">Section ${index + 1}</span>
        <span class="section-score ${riskClass}">${prob}% AI</span>
      </div>
      <p class="section-text">${section.text}</p>
      <p class="rationale">Rationale: ${section.rationale}</p>
      ${section.markers.length > 0 ? `<p class="markers">Markers: ${section.markers.map(m => `<span>${m}</span>`).join('')}</p>` : ''}
    </div>
      `;
    }).join('')}
  </div>
</body>
</html>
  `.trim();
}

export async function generatePdfReport(data: PdfReportData): Promise<Buffer> {
  const html = generateHtmlReport(data);
  
  const puppeteer = await import('puppeteer-core');
  
  // Prefer system-installed Chromium (e.g., in Docker), fall back to @sparticuz/chromium
  let executablePath = '/usr/bin/chromium';
  const systemPaths = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];
  let foundSystem = false;
  const fs = await import('fs');
  for (const p of systemPaths) {
    try {
      await fs.promises.access(p, fs.constants.X_OK);
      executablePath = p;
      foundSystem = true;
      break;
    } catch {}
  }
  
  let browserArgs: string[];
  if (foundSystem) {
    browserArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'];
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const chromium = require('@sparticuz/chromium');
    executablePath = await chromium.executablePath();
    browserArgs = chromium.args;
  }

  const browser = await puppeteer.launch({
    args: browserArgs,
    defaultViewport: { width: 800, height: 600 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
