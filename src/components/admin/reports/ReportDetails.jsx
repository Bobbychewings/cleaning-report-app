import React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileSignature, Download, MessageSquare, ImageIcon } from 'lucide-react';
import { downloadPDF } from '../../../lib/pdfGenerator';

export default function ReportDetails({ report, onBack }) {
  if (!report) return null;

  const dateStr = report.submittedAt ? format(report.submittedAt.toDate(), 'PPP p') : 'Unknown Date';

  // Convert answers object to array for easier rendering
  const answersList = Object.entries(report.answers || {})
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const failedItems = answersList.filter(item => item.passed === false && item.type !== 'section');

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6 max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition"
          title="Back to list"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{report.locationName} Inspection</h2>
          <p className="text-sm text-gray-500 mt-1">Submitted by <span className="font-medium text-gray-900">{report.staffName}</span> on {dateStr}</p>
        </div>

        {/* Export PDF Button */}
        <div className="flex gap-4 items-center">
          <button
            onClick={() => downloadPDF(report)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

        {/* Health Score Badge */}
        <div className="text-right">
          <div className={`inline-flex flex-col items-center justify-center p-4 rounded-xl shadow-sm border
            ${report.healthScore >= 90 ? 'bg-green-50 border-green-200' :
              report.healthScore >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}
          >
            <span className={`text-3xl font-bold leading-none mb-1
              ${report.healthScore >= 90 ? 'text-green-700' :
                report.healthScore >= 70 ? 'text-yellow-700' : 'text-red-700'}`}
            >
              {report.healthScore}%
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Health Score</span>
          </div>
        </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">Total Checks</p>
          <p className="text-2xl font-bold text-gray-900">{report.totalChecks || answersList.length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <p className="text-sm text-red-600">Failed / Issues</p>
          <p className="text-2xl font-bold text-red-700 flex items-center gap-2">
            {report.failedChecks}
            {report.failedChecks > 0 && <AlertTriangle size={20} className="text-red-500" />}
          </p>
        </div>
      </div>

      {/* Failed Items Highlight (Only show if there are failures) */}
      {failedItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-4">
            <XCircle className="text-red-500" size={24} />
            Issues Requiring Attention
          </h3>
          <div className="space-y-4">
            {failedItems.map(item => (
              <AnswerCard key={item.id} item={item} isFailed={true} />
            ))}
          </div>
        </div>
      )}

      {/* Full Audit Details */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <CheckCircle2 className="text-green-500" size={24} />
          Full Audit Details
        </h3>
        {answersList.length === 0 ? (
          <p className="text-gray-500 italic">No items recorded.</p>
        ) : (
          <div className="space-y-4">
            {answersList.map(item => (
              <AnswerCard key={item.id} item={item} isFailed={item.passed === false && item.type !== 'section'} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// Helper component for rendering individual answers
function AnswerCard({ item, isFailed }) {

  const renderExtraAttachments = () => {
    return (
      <div className="mt-3 flex flex-col gap-2">
        {item.comment && (
          <div className="bg-white border border-gray-200 rounded p-3 text-sm flex gap-2 items-start shadow-sm">
            <MessageSquare size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 italic">{item.comment}</p>
          </div>
        )}
        {item.images && item.images.length > 0 && (
          <div className="bg-white border border-gray-200 rounded p-3 text-sm shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <ImageIcon size={16} />
              <span className="font-medium text-xs uppercase tracking-wide">Attached Photos</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.images.map((imgUrl, i) => (
                <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={imgUrl} alt={`Attached Evidence ${i + 1}`} className="h-20 w-auto object-cover rounded border border-gray-200 shadow-sm hover:opacity-90 transition" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnswerContent = () => {
    if (item.type === 'section') return null;
    if (!item.answer && item.answer !== false) return <span className="text-gray-400 italic">No answer provided</span>;

    // Handle Image type
    if (item.type === 'image') {
      const images = Array.isArray(item.answer) ? item.answer : [item.answer];
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((imgUrl, i) => (
            <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block">
              <img src={imgUrl} alt={`Audit Evidence ${i + 1}`} className="h-32 w-auto object-cover rounded border border-gray-200 shadow-sm hover:opacity-90 transition" />
            </a>
          ))}
        </div>
      );
    }

    // Handle Signature type
    if (item.type === 'signature') {
      return (
        <div className="mt-2 inline-block border border-gray-200 rounded p-2 bg-white">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 uppercase tracking-wide border-b pb-1">
            <FileSignature size={14}/> Signed By Staff
          </div>
          <img src={item.answer} alt="Signature" className="h-16 w-auto object-contain" />
        </div>
      );
    }

    // Handle Toggle Text type
    if (item.type === 'toggle_text' && typeof item.answer === 'object') {
      return (
        <div className="mt-1">
          <span className="font-semibold capitalize bg-gray-100 px-2 py-1 rounded text-sm mr-2">{item.answer.toggle}</span>
          {item.answer.text && <span className="text-gray-700">{item.answer.text}</span>}
        </div>
      );
    }

    // Handle Checkbox type
    if (item.type === 'checkbox') {
      const selections = Array.isArray(item.answer) ? item.answer : [];
      if (selections.length === 0) return <span className="text-gray-400 italic">None selected</span>;
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {selections.map((sel, idx) => (
            <span key={idx} className="bg-white border border-gray-200 px-2 py-1 rounded text-sm font-medium text-gray-700 shadow-sm">{sel}</span>
          ))}
        </div>
      );
    }

    // Default text/boolean handling
    return <span className="font-medium text-gray-900 capitalize">{String(item.answer)}</span>;
  };

  if (item.type === 'section') {
    return (
      <div className="pt-4 pb-2 border-b-2 border-gray-200 mt-6 mb-2">
        <h4 className="font-bold text-2xl text-gray-900">{item.question}</h4>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border flex flex-col sm:flex-row gap-4
      ${isFailed ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
    >
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 text-sm mb-1">{item.question}</h4>
        <div className="text-base">
          {renderAnswerContent()}
        </div>
        {renderExtraAttachments()}
      </div>

      {/* Visual Indicator */}
      <div className="flex-shrink-0 flex items-start pt-1">
        {isFailed ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Failed
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Passed
          </span>
        )}
      </div>
    </div>
  );
}
