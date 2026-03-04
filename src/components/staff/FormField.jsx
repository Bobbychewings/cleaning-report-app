import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function FormField({ field, value, onChange }) {
  const [toggleText, setToggleText] = useState(value?.text || '');
  const [toggleValue, setToggleValue] = useState(value?.toggle || '');
  const sigCanvas = useRef(null);

  // Load initial signature if exists (rarely used, but good practice)
  useEffect(() => {
    if (field.type === 'signature' && value && sigCanvas.current) {
      // sigCanvas.current.fromDataURL(value); // If we wanted to load existing signature
    }
  }, [field.type, value]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(file); // Passing File object up to parent to handle upload later
    }
  };

  const handleClearSignature = (e) => {
    e.preventDefault();
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onChange(null);
    }
  };

  const handleEndSignature = () => {
    if (sigCanvas.current) {
      if(sigCanvas.current.isEmpty()){
        onChange(null);
      } else {
        onChange(sigCanvas.current.toDataURL()); // Save as base64 string
      }
    }
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 mt-1"
            required={field.required}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'textarea':
        return (
          <textarea
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 mt-1 h-24"
            required={field.required}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'yes_no':
        return (
          <div className="flex gap-4 mt-2">
            <label className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${value === 'yes' ? 'bg-green-50 border-green-500 text-green-700 font-semibold' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              <input
                type="radio"
                name={`field-${field.id}`}
                className="hidden"
                required={field.required}
                checked={value === 'yes'}
                onChange={() => onChange('yes')}
              />
              Yes
            </label>
            <label className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${value === 'no' ? 'bg-red-50 border-red-500 text-red-700 font-semibold' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              <input
                type="radio"
                name={`field-${field.id}`}
                className="hidden"
                required={field.required}
                checked={value === 'no'}
                onChange={() => onChange('no')}
              />
              No
            </label>
          </div>
        );
      case 'mcq':
        return (
          <div className="space-y-2 mt-2">
            {(field.options || []).map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  required={field.required}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'image':
        return (
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              capture="environment" // Hint to mobile devices to use back camera
              onChange={handleImageChange}
              required={field.required && !value}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100 cursor-pointer"
            />
            {value instanceof File && <p className="mt-2 text-sm text-green-600">✓ Image selected: {value.name}</p>}
          </div>
        );
      case 'signature':
        return (
          <div className="mt-2 border rounded-md shadow-sm border-gray-300 overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{ className: 'w-full h-40' }}
              onEnd={handleEndSignature}
            />
            <div className="bg-gray-50 p-2 border-t flex justify-end">
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear Signature
              </button>
            </div>
            {field.required && !value && <input type="text" required style={{opacity:0, height:0, width:0, position:'absolute'}}/>}
          </div>
        );
      case 'toggle_text':
        return (
          <div className="mt-2 space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`toggle-${field.id}`}
                  checked={toggleValue === 'yes'}
                  onChange={() => {
                    setToggleValue('yes');
                    onChange({ toggle: 'yes', text: toggleText });
                  }}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`toggle-${field.id}`}
                  checked={toggleValue === 'no'}
                  onChange={() => {
                    setToggleValue('no');
                    onChange({ toggle: 'no', text: toggleText });
                  }}
                  className="text-primary-600 focus:ring-primary-500"
                />
                No
              </label>
            </div>
            {toggleValue && (
              <input
                type="text"
                placeholder="Please provide details..."
                required={field.required}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3"
                value={toggleText}
                onChange={(e) => {
                  setToggleText(e.target.value);
                  onChange({ toggle: toggleValue, text: e.target.value });
                }}
              />
            )}
          </div>
        );
      default:
        return <p className="text-red-500">Unknown field type: {field.type}</p>;
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <label className="block text-base font-medium text-gray-900 mb-1">
        {field.question}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
    </div>
  );
}
