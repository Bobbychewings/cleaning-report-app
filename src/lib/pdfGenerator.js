import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const fetchImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch image:', url, error);
    return null;
  }
};

const createPDFDoc = async (reportData) => {
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

  // Attached Images Section
  const imagesToRender = [];

  for (const [key, result] of sortedAnswers) {
    if (result.type === 'section') continue;

    const questionText = result.question || key;

    // Collect images attached to the question
    let questionImages = [];
    if (result.images && Array.isArray(result.images)) {
      questionImages = [...result.images];
    }

    // Collect image answers if type is image
    if (result.type === 'image' && result.answer) {
      if (Array.isArray(result.answer)) {
        questionImages.push(...result.answer);
      } else {
        questionImages.push(result.answer);
      }
    }

    if (questionImages.length > 0) {
      imagesToRender.push({
        question: questionText,
        images: questionImages
      });
    }
  }

  if (imagesToRender.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Attached Images', 14, 22);

    let currentY = 32;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxImageWidth = pageWidth - margin * 2;
    const maxImageHeight = 150;

    for (const item of imagesToRender) {
      // Check if we need a new page for the question title
      if (currentY > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');

      const splitTitle = doc.splitTextToSize(`Question: ${item.question}`, maxImageWidth);
      doc.text(splitTitle, margin, currentY);
      currentY += splitTitle.length * 7 + 2;

      doc.setFont(undefined, 'normal');

      for (const imgUrl of item.images) {
        try {
          const base64Data = await fetchImageAsBase64(imgUrl);
          if (!base64Data) continue;

          const imgProps = doc.getImageProperties(base64Data);
          const ratio = imgProps.width / imgProps.height;

          let renderWidth = maxImageWidth;
          let renderHeight = renderWidth / ratio;

          if (renderHeight > maxImageHeight) {
            renderHeight = maxImageHeight;
            renderWidth = renderHeight * ratio;
          }

          // Check if we need a new page for the image
          if (currentY + renderHeight > doc.internal.pageSize.getHeight() - 10) {
            doc.addPage();
            currentY = 20;
          }

          doc.addImage(base64Data, imgProps.fileType, margin, currentY, renderWidth, renderHeight);
          currentY += renderHeight + 10;
        } catch (error) {
          console.error('Error rendering image in PDF:', error);
          doc.setFontSize(10);
          doc.text('[Image Failed to Load]', margin, currentY);
          currentY += 10;
        }
      }

      currentY += 5; // Extra spacing between questions
    }
  }

  return doc;
};

export const generatePDFBase64 = async (reportData) => {
  const doc = await createPDFDoc(reportData);
  return doc.output('datauristring');
};

export const downloadPDF = async (reportData) => {
  const doc = await createPDFDoc(reportData);
  const dateStr = reportData.submittedAt instanceof Date ? reportData.submittedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  doc.save(`Audit_Report_${reportData.locationName.replace(/\s+/g, '_')}_${dateStr}.pdf`);
};
