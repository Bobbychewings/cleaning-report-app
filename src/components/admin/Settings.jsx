import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save } from 'lucide-react';

export default function Settings() {
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'notifications');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAdminEmail(docSnap.data().adminEmail || '');
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await setDoc(doc(db, 'settings', 'notifications'), {
        adminEmail: adminEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setMessage({ text: 'Settings saved successfully.', type: 'success' });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ text: 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading Settings...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6 max-w-2xl">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">Notification Settings</h3>

      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
            Admin Email Address
          </label>
          <p className="text-sm text-gray-500 mb-2">
            This email address will receive notifications when staff submit new audit reports.
          </p>
          <input
            type="email"
            id="adminEmail"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 border"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@eventspace.com"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
