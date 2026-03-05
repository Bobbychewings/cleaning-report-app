import React, { useState } from 'react';
import ReportsList from './ReportsList';
import ReportDetails from './ReportDetails';

export default function ReportsManager({ initialReportId }) {
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div>
      {!selectedReport ? (
        <ReportsList onSelectReport={setSelectedReport} initialReportId={initialReportId} />
      ) : (
        <ReportDetails report={selectedReport} onBack={() => setSelectedReport(null)} />
      )}
    </div>
  );
}
