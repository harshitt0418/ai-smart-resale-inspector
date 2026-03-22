/**
 * services/reportService.js  — Part 12
 *
 * Generates a PDF inspection report using pdfkit and stores it in
 * backend/reports/<sessionId>.pdf.
 * Returns the filename so the download route can stream it.
 */

const fs    = require('fs');
const path  = require('path');
const PDFDocument = require('pdfkit');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

// Ensure the reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  red:    '#EF4444',
  green:  '#10B981',
  amber:  '#F59E0B',
  dark:   '#0A0A0F',
  mid:    '#1A1A2E',
  muted:  '#6B7280',
  white:  '#F9FAFB',
};

const GRADE_COLOURS = { A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' };
const SEV_COLOURS   = { minor: C.amber, moderate: '#F97316', severe: C.red };

/**
 * Generate a PDF report for the inspection result.
 *
 * @param {{
 *   sessionId:   string,
 *   item:        { label, confidence, boundingBox },
 *   damages:     Array<{ type, severity, confidence }>,
 *   severityScore: number,
 *   conditionGrade: string,
 *   conditionLabel: string,
 *   itemAgeYears: number,
 *   repairCost:  { min, max, currency },
 *   marketPrice: { newPrice, currentPrice, currency },
 *   suggestedResalePrice: number,
 * }} result
 * @returns {Promise<string>}  Filename (relative to REPORTS_DIR)
 */
async function generateReport(result) {
  const filename = `${result.sessionId}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size:    'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    stream.on('finish', resolve);
    stream.on('error',  reject);

    const { width } = doc.page;
    const usable    = width - doc.page.margins.left - doc.page.margins.right;

    // ── Header bar ────────────────────────────────────────────────────────
    doc.rect(0, 0, width, 80).fill(C.mid);
    doc.fillColor(C.white)
      .font('Helvetica-Bold').fontSize(20)
      .text('AI Smart Resale Inspector', 60, 25);
    doc.fillColor(C.muted).font('Helvetica').fontSize(10)
      .text('Automated Inspection Report', 60, 52);

    // Date & session ID top-right
    const now = new Date().toUTCString().replace(' GMT', ' UTC');
    doc.fillColor(C.muted).font('Helvetica').fontSize(8)
      .text(`Generated: ${now}`, 60, 65, { width: usable, align: 'right' });

    doc.moveDown(4);

    // ── Section: Item ─────────────────────────────────────────────────────
    _sectionHeader(doc, 'Detected Item', C.red, usable);

    _labelValue(doc, 'Item',       result.item?.label ?? 'Unknown');
    _labelValue(doc, 'Confidence', `${Math.round((result.item?.confidence ?? 0) * 100)}%`);
    _labelValue(doc, 'Session ID', result.sessionId);

    doc.moveDown(0.8);

    // ── Section: Condition ────────────────────────────────────────────────
    _sectionHeader(doc, 'Condition Assessment', C.amber, usable);

    // Grade badge
    const grade       = result.conditionGrade ?? 'C';
    const gradeColour = GRADE_COLOURS[grade] ?? C.amber;

    doc
      .roundedRect(doc.page.margins.left, doc.y, 60, 36, 6)
      .fill(gradeColour);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(28)
      .text(grade, doc.page.margins.left, doc.y - 30, { width: 60, align: 'center' });

    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(14)
      .text(result.conditionLabel ?? 'Fair', doc.page.margins.left + 70, doc.y - 28);
    doc.fillColor(C.muted).font('Helvetica').fontSize(10)
      .text(`Severity score: ${result.severityScore ?? 0} / 100`, doc.page.margins.left + 70, doc.y + 1);

    doc.moveDown(2.5);

    // ── Section: Damages ──────────────────────────────────────────────────
    _sectionHeader(doc, `Damage Analysis  (${(result.damages ?? []).length} region${(result.damages ?? []).length === 1 ? '' : 's'})`, '#F97316', usable);

    if ((result.damages ?? []).length === 0) {
      doc.fillColor(C.muted).font('Helvetica').fontSize(10).text('No damage detected.');
    } else {
      for (const [i, d] of result.damages.entries()) {
        const sevColour = SEV_COLOURS[d.severity] ?? C.amber;
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(10)
          .text(`${i + 1}.  `, { continued: true });
        doc.fillColor(sevColour).text(`[${d.severity.toUpperCase()}] `, { continued: true });
        doc.fillColor(C.dark).text(
          `${d.type.charAt(0).toUpperCase() + d.type.slice(1)}` +
          `  —  confidence ${Math.round(d.confidence * 100)}%`,
        );
      }
    }

    doc.moveDown(0.8);

    // ── Section: Financials ───────────────────────────────────────────────
    _sectionHeader(doc, 'Financial Summary', C.green, usable);

    const cur = result.repairCost?.currency ?? 'USD';
    const mp  = result.marketPrice;

    _labelValue(doc, 'Item Age',              `${result.itemAgeYears ?? 0} year(s)`);
    _labelValue(doc, 'New / RRP Price',        `${cur} ${(mp?.newPrice ?? 0).toLocaleString()}`);
    _labelValue(doc, 'Current Market Value',   `${cur} ${(mp?.currentPrice ?? 0).toLocaleString()}`);
    _labelValue(doc, 'Repair Cost Estimate',
      `${cur} ${(result.repairCost?.min ?? 0).toLocaleString()} – ${(result.repairCost?.max ?? 0).toLocaleString()}`);

    doc.moveDown(0.5);

    // Suggested price highlight
    const rrp = result.suggestedResalePrice ?? 0;
    doc
      .roundedRect(doc.page.margins.left, doc.y, usable, 46, 8)
      .fill('#052e16');
    doc.fillColor(C.muted).font('Helvetica').fontSize(9)
      .text('SUGGESTED RESALE PRICE', doc.page.margins.left + 16, doc.y - 38);
    doc.fillColor(C.green).font('Helvetica-Bold').fontSize(26)
      .text(`${cur} ${rrp.toLocaleString()}`, doc.page.margins.left + 16, doc.y - 24);

    doc.moveDown(3.5);

    // ── Footer ────────────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 40, width, 40).fill(C.mid);
    doc.fillColor(C.muted).font('Helvetica').fontSize(8)
      .text(
        'This report is generated by AI and is for informational purposes only. ' +
        'Values are estimates and may vary.',
        60,
        doc.page.height - 27,
        { width: usable, align: 'center' },
      );

    doc.end();
  });

  return filename;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _sectionHeader(doc, title, colour, usable) {
  doc.moveDown(0.3);
  const y = doc.y;
  doc.rect(doc.page.margins.left, y, 4, 16).fill(colour);
  doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(12)
    .text(title, doc.page.margins.left + 12, y + 2);
  doc.moveDown(0.6);
}

function _labelValue(doc, label, value) {
  doc.fillColor(C.muted).font('Helvetica').fontSize(9)
    .text(`${label}:  `, { continued: true });
  doc.fillColor(C.dark).font('Helvetica-Bold')
    .text(value);
}

/**
 * Return the full file-system path for a given session's report.
 * @param {string} sessionId
 * @returns {string|null}
 */
function getReportPath(sessionId) {
  const fp = path.join(REPORTS_DIR, `${sessionId}.pdf`);
  return fs.existsSync(fp) ? fp : null;
}

/**
 * List all generated reports, newest first.
 * @returns {{ filename: string, url: string, createdAt: string }[]}
 */
function listReports() {
  if (!fs.existsSync(REPORTS_DIR)) return [];
  return fs.readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith('.pdf'))
    .map((filename) => {
      const stat = fs.statSync(path.join(REPORTS_DIR, filename));
      return {
        filename,
        url: `/api/report/${encodeURIComponent(filename)}`,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = { generateReport, getReportPath, listReports };
