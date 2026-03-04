import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePDFBase64 = (reportData) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Audit Report', 14, 22);

  // Location Info
  doc.setFontSize(12);
  doc.text(`Location: ${reportData.locationName}`, 14, 32);
  doc.text(`Staff: ${reportData.staffName} (${reportData.staffEmail})`, 14, 40);

  const dateStr = reportData.submittedAt instanceof Date ? reportData.submittedAt.toLocaleString() : new Date().toLocaleString();
  doc.text(`Date: ${dateStr}`, 14, 48);

  // Health Score
  doc.setFontSize(14);
  doc.text(`Health Score: ${reportData.healthScore}%`, 14, 60);
  doc.setFontSize(12);
  doc.text(`Total Checks: ${reportData.totalChecks}`, 14, 68);
  doc.text(`Failed Checks: ${reportData.failedChecks}`, 14, 76);

  // Answers Table
  const tableData = [];

  for (const [key, result] of Object.entries(reportData.answers || {})) {
    let answerText = result.answer;
    if (Array.isArray(result.answer)) {
      answerText = `[${result.answer.length} Images Uploaded]`;
    } else if (result.type === 'image' && result.answer) {
      answerText = '[Image Uploaded]';
    } else if (result.type === 'signature' && result.answer) {
      answerText = '[Signature Provided]';
    } else if (result.type === 'toggle_text') {
      answerText = `${result.answer?.toggle} - ${result.answer?.text}`;
    }

    tableData.push([
      result.question || key,
      answerText !== null && answerText !== undefined ? String(answerText) : 'N/A',
      result.passed ? 'Pass' : 'Fail'
    ]);
  }

  doc.autoTable({
    startY: 85,
    head: [['Question', 'Answer', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] } // Using #2563eb blue to match new theme
  });

  // Get base64 string
  const pdfBase64 = doc.output('datauristring');

  return pdfBase64;
};
