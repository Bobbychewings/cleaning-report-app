import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, GripVertical, Settings } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'yes_no', label: 'Yes/No' },
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'image', label: 'Image Upload' },
  { value: 'signature', label: 'Signature Pad' },
  { value: 'toggle_text', label: 'Toggle with Text (If Yes/No)' }
];

export default function FormBuilder() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      loadForm(selectedLocation);
    } else {
      setFields([]);
    }
  }, [selectedLocation]);

  async function fetchLocations() {
    try {
      const querySnapshot = await getDocs(collection(db, 'locations'));
      const locList = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setLocations(locList);
      if (locList.length > 0) {
        setSelectedLocation(locList[0].id);
      }
    } catch (error) {
      console.error("Error fetching locations: ", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadForm(locationId) {
    setLoading(true);
    try {
      const formDoc = await getDoc(doc(db, 'forms', locationId));
      if (formDoc.exists()) {
        setFields(formDoc.data().fields || []);
      } else {
        setFields([]); // No form yet for this location
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveForm() {
    if (!selectedLocation) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'forms', selectedLocation), {
        locationId: selectedLocation,
        fields: fields,
        updatedAt: new Date().toISOString()
      });
      alert('Form saved successfully!');
    } catch (error) {
      console.error("Error saving form:", error);
      alert('Failed to save form.');
    } finally {
      setSaving(false);
    }
  }

  const addField = () => {
    const newField = {
      id: Date.now().toString(),
      type: 'text',
      question: '',
      required: true,
      options: [], // For MCQ
      expectedAnswer: '', // To trigger "fail" state
      failCondition: '' // E.g., 'no' for Yes/No, or specific text
    };
    setFields([...fields, newField]);
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const addOption = (fieldId) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, options: [...(f.options || []), 'New Option'] };
      }
      return f;
    }));
  };

  const updateOption = (fieldId, index, value) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        const newOptions = [...f.options];
        newOptions[index] = value;
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  if (loading && locations.length === 0) return <div>Loading Builder...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Form Builder</h3>
        <div className="flex gap-4 items-center">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="" disabled>Select Location...</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <button
            onClick={saveForm}
            disabled={saving || !selectedLocation}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      {!selectedLocation ? (
        <div className="text-center py-10 text-gray-500">Please select or add a location first to build its form.</div>
      ) : (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
              <div className="flex items-start gap-4">
                <div className="cursor-move text-gray-400 mt-2">
                  <GripVertical size={20} />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Question Title"
                      value={field.question}
                      onChange={(e) => updateField(field.id, 'question', e.target.value)}
                      className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, 'type', e.target.value)}
                      className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      {FIELD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* MCQ Options Builder */}
                  {field.type === 'mcq' && (
                    <div className="ml-4 space-y-2">
                      <label className="text-sm font-medium text-gray-700">Options</label>
                      {(field.options || []).map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(field.id, oIdx, e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-primary-500"
                          />
                        </div>
                      ))}
                      <button type="button" onClick={() => addOption(field.id)} className="text-sm text-primary-600 hover:text-primary-800">+ Add Option</button>
                    </div>
                  )}

                  {/* Failure Conditions / Expected Answer settings */}
                  <div className="bg-white p-3 rounded border border-gray-200 mt-4 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Settings size={16} className="text-gray-400"/>
                      <span className="text-sm font-medium text-gray-700">Health Score Settings:</span>
                    </div>

                    {field.type === 'yes_no' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Expected Answer (Pass):</span>
                        <select
                          value={field.expectedAnswer || ''}
                          onChange={(e) => updateField(field.id, 'expectedAnswer', e.target.value)}
                          className="text-sm border-gray-300 rounded-md"
                        >
                          <option value="">None (Always Pass)</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    )}

                    {field.type === 'mcq' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Expected Answer (Pass):</span>
                        <select
                          value={field.expectedAnswer || ''}
                          onChange={(e) => updateField(field.id, 'expectedAnswer', e.target.value)}
                          className="text-sm border-gray-300 rounded-md"
                        >
                          <option value="">None (Always Pass)</option>
                          {(field.options || []).map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex-1"></div>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Required Field</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => removeField(field.id)}
                  className="text-gray-400 hover:text-red-500 transition p-2"
                  title="Remove Question"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addField}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 transition flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Add New Question
          </button>
        </div>
      )}
    </div>
  );
}
