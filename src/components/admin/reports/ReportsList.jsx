import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { format } from 'date-fns';
import { FileText, AlertTriangle, CheckCircle, Search } from 'lucide-react';

export default function ReportsList({ onSelectReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const q = query(collection(db, 'reports'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const reportsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsList);
    } catch (error) {
      console.error("Error fetching reports: ", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredReports = reports.filter(r =>
    r.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.staffName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Audit Reports</h3>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search location or staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Score</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelectReport(report)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {report.submittedAt ? format(report.submittedAt.toDate(), 'MMM d, yyyy h:mm a') : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {report.locationName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {report.staffName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${report.healthScore >= 90 ? 'bg-green-100 text-green-800' :
                        report.healthScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {report.healthScore}%
                    </span>
                    {report.failedChecks > 0 && (
                      <span className="ml-2 text-xs text-red-500 flex items-center" title={`${report.failedChecks} issues found`}>
                        <AlertTriangle size={12} className="mr-1" /> {report.failedChecks}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 flex items-center justify-end gap-1 w-full">
                    <FileText size={16} /> View
                  </button>
                </td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                  No reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
