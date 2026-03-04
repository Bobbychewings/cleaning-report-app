import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import FormField from '../../components/staff/FormField';
import { sendAuditNotification } from '../../lib/emailService';

export default function AuditForm() {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [location, setLocation] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [locationId]);

  async function fetchData() {
    try {
      // Fetch Location Details
      const locDoc = await getDoc(doc(db, 'locations', locationId));
      if (locDoc.exists()) {
        setLocation(locDoc.data());
      }

      // Fetch Form Configuration
      const formDoc = await getDoc(doc(db, 'forms', locationId));
      if (formDoc.exists()) {
        setFormConfig(formDoc.data());
      } else {
        setError('No form configured for this location yet.');
      }
    } catch (err) {
      console.error("Error fetching form:", err);
      setError('Failed to load form.');
    } finally {
      setLoading(false);
    }
  }

  const handleAnswerChange = (fieldId, value) => {
    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const uploadImages = async () => {
    const uploadedAnswers = { ...answers };
    for (const [key, value] of Object.entries(answers)) {
      if (value instanceof File) {
        // It's an image file that needs uploading
        const fileRef = ref(storage, `audits/${Date.now()}_${value.name}`);
        const uploadResult = await uploadBytes(fileRef, value);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        uploadedAnswers[key] = downloadUrl; // Replace File object with URL
      }
    }
    return uploadedAnswers;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 1. Upload any images first
      const finalAnswers = await uploadImages();

      // 2. Calculate initial pass/fail status per question
      let totalQuestionsWithExpectation = 0;
      let failedQuestions = 0;
      const results = {};

      formConfig.fields.forEach(field => {
        const answer = finalAnswers[field.id];
        let passed = true; // Assume pass unless proven otherwise

        if (field.expectedAnswer) {
          totalQuestionsWithExpectation++;
          // Basic comparison for yes/no and mcq
          if (field.type === 'yes_no' || field.type === 'mcq') {
            if (answer !== field.expectedAnswer) {
              passed = false;
              failedQuestions++;
            }
          }
        }

        results[field.id] = {
          question: field.question,
          type: field.type,
          answer: answer !== undefined ? answer : null,
          passed: passed
        };
      });

      // Calculate overall health score
      const healthScore = totalQuestionsWithExpectation === 0
        ? 100
        : Math.round(((totalQuestionsWithExpectation - failedQuestions) / totalQuestionsWithExpectation) * 100);

      // 3. Save the completed audit report
      const reportData = {
        locationId,
        locationName: location.name,
        staffId: currentUser.uid,
        staffName: currentUser.displayName,
        staffEmail: currentUser.email,
        answers: results,
        healthScore,
        totalChecks: totalQuestionsWithExpectation,
        failedChecks: failedQuestions,
        submittedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'reports'), reportData);

      // 4. Send Email Notification to Admin
      // TODO: Ideally, we fetch the admin emails from the users collection here
      // For now, we will attempt to send to a placeholder email or log the intent.
      await sendAuditNotification({ ...reportData, id: docRef.id }, "admin@eventspace.com");

      // 5. Success UI & Redirect
      alert('Audit submitted successfully! Health Score: ' + healthScore + '%');
      navigate('/staff');

    } catch (err) {
      console.error("Error submitting form:", err);
      setError('Failed to submit form. Please ensure you have internet connection to upload photos.');
      setSubmitting(false); // Enable the button again if there's an error
    }
  };

  if (loading) return <div className="p-8 text-center">Loading form...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 truncate">New Audit</h1>
          <p className="text-sm text-primary-600 font-medium truncate">{location?.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 max-w-3xl mx-auto w-full mb-20">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100 flex gap-3">
              <CheckCircle className="flex-shrink-0" size={20} />
              <p>Please fill out all required fields carefully. Upload photos where necessary to prove the state of the event space.</p>
            </div>

            {formConfig?.fields?.map((field) => (
              <FormField
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={(val) => handleAnswerChange(field.id, val)}
              />
            ))}

            {/* Sticky Submit Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-10 sm:relative sm:border-0 sm:bg-transparent sm:p-0">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto sm:px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 transition-colors focus:ring-4 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {submitting ? 'Uploading & Submitting...' : 'Submit Audit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
