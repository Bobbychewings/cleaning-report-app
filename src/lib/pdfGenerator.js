import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const createPDFDoc = (reportData) => {
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

  const sortedAnswers = Object.entries(reportData.answers || {})
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  for (const [key, result] of sortedAnswers) {
    if (result.type === 'section') {
      const sectionText = result.question || key;
      tableData.push([
        { content: sectionText, colSpan: 3, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
      ]);
      continue;
    }

    let answerText = result.answer;
    if (result.type === 'checkbox' && Array.isArray(result.answer)) {
      answerText = result.answer.join(', ');
    } else if (Array.isArray(result.answer)) {
      answerText = `[${result.answer.length} Images Uploaded]`;
    } else if (result.type === 'image' && result.answer) {
      answerText = '[Image Uploaded]';
    } else if (result.type === 'signature' && result.answer) {
      answerText = '[Signature Provided]';
    } else if (result.type === 'toggle_text') {
      answerText = `${result.answer?.toggle} - ${result.answer?.text}`;
    }

    if (result.comment) {
      answerText += `\nComment: ${result.comment}`;
    }
    if (result.images && result.images.length > 0) {
      answerText += `\n[${result.images.length} Image(s) Attached]`;
    }

    tableData.push([
      result.question || key,
      answerText !== null && answerText !== undefined ? String(answerText) : 'N/A',
      result.passed ? 'Pass' : 'Fail'
    ]);
  }

  autoTable(doc, {
    startY: 85,
    head: [['Question', 'Answer', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] } // Using #2563eb blue to match new theme
  });

  return doc;
};

export const generatePDFBase64 = (reportData) => {
  const doc = createPDFDoc(reportData);
  return doc.output('datauristring');
};

export const downloadPDF = (reportData) => {
  const doc = createPDFDoc(reportData);
  const dateStr = reportData.submittedAt instanceof Date ? reportData.submittedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  doc.save(`Audit_Report_${reportData.locationName.replace(/\s+/g, '_')}_${dateStr}.pdf`);
};
