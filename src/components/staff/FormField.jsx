import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, Image as ImageIcon, X, Paperclip, MessageSquare } from 'lucide-react';

export default function FormField({ field, value, onChange, images = [], onImagesChange, comment = '', onCommentChange }) {
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
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      const newValues = [...currentValues, ...files].slice(0, 10); // Limit to 10
      onChange(newValues.length > 0 ? newValues : null);
    }
  };

  const handleRemoveImage = (e, index) => {
    e.preventDefault();
    if (Array.isArray(value)) {
      const newValues = [...value];
      newValues.splice(index, 1);
      onChange(newValues.length > 0 ? newValues : null);
    } else {
      onChange(null);
    }
  };

  const handleClearSignature = (e) => {
    e.preventDefault();
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onChange(null);
    }
  };

  const [showCommentInput, setShowCommentInput] = useState(false);

  const handleEndSignature = () => {
    if (sigCanvas.current) {
      if(sigCanvas.current.isEmpty()){
        onChange(null);
      } else {
        onChange(sigCanvas.current.toDataURL()); // Save as base64 string
      }
    }
  };

  const handleExtraImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [...images, ...files].slice(0, 10);
      if (onImagesChange) onImagesChange(newImages);
    }
  };

  const handleRemoveExtraImage = (e, index) => {
    e.preventDefault();
    const newImages = [...images];
    newImages.splice(index, 1);
    if (onImagesChange) onImagesChange(newImages);
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
      case 'checkbox': {
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2 mt-2">
            {(field.options || []).map((opt, i) => {
              const isChecked = selectedValues.includes(opt);
              return (
                <label key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      let newValues;
                      if (e.target.checked) {
                        newValues = [...selectedValues, opt];
                      } else {
                        newValues = selectedValues.filter((v) => v !== opt);
                      }
                      onChange(newValues.length > 0 ? newValues : null);
                    }}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              );
            })}
            {field.required && selectedValues.length === 0 && (
              <input type="checkbox" required className="opacity-0 absolute -z-10" />
            )}
          </div>
        );
      }
      case 'image': {
        const currentImages = Array.isArray(value) ? value : (value ? [value] : []);
        return (
          <div className="mt-2 space-y-3">
            {currentImages.length < 10 && (
              <div className="flex gap-3">
                <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-primary-600">
                  <Camera size={24} className="mb-2" />
                  <span className="text-sm font-medium">Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-primary-600">
                  <ImageIcon size={24} className="mb-2" />
                  <span className="text-sm font-medium">Upload Image(s)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {currentImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {currentImages.map((img, index) => (
                  <div key={index} className="relative border rounded-lg p-2 bg-gray-50">
                    <img
                      src={img instanceof File ? URL.createObjectURL(img) : img}
                      alt={`Uploaded preview ${index + 1}`}
                      className="h-32 w-full object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleRemoveImage(e, index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                    >
                      <X size={16} />
                    </button>
                    {img instanceof File && (
                      <p className="text-xs text-center text-green-600 font-medium mt-2 truncate">
                        {img.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Hidden input to ensure HTML5 validation still triggers if required but not answered */}
            {field.required && currentImages.length === 0 && <input type="text" required className="opacity-0 h-0 w-0 absolute -z-10" />}
          </div>
        );
      }
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

  const renderExtraActions = () => {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-sm font-medium text-gray-700 cursor-pointer transition-colors">
            <Paperclip size={16} className="text-gray-500" />
            Attach Photo
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleExtraImageChange}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowCommentInput(!showCommentInput);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${
              showCommentInput || comment ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
            }`}
          >
            <MessageSquare size={16} className={showCommentInput || comment ? 'text-primary-600' : 'text-gray-500'} />
            Add Comment
          </button>
        </div>

        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={img instanceof File ? URL.createObjectURL(img) : img}
                  alt={`Attachment ${index + 1}`}
                  className="h-16 w-16 object-cover rounded border border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={(e) => handleRemoveExtraImage(e, index)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {(showCommentInput || comment) && (
          <textarea
            placeholder="Add a comment to explain..."
            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 h-20"
            value={comment}
            onChange={(e) => { if (onCommentChange) onCommentChange(e.target.value); }}
          />
        )}
      </div>
    );
  };

  if (field.type === 'section') {
    return (
      <div className="pt-6 pb-2 border-b-2 border-gray-200 mb-6 group">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{field.question}</h2>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <label className="block text-base font-medium text-gray-900 mb-1">
        {field.question}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.referenceImage && (
        <div className="mb-3">
          <img src={field.referenceImage} alt="Reference" className="max-w-full h-auto rounded-lg border border-gray-200" />
        </div>
      )}
      {renderField()}
      {field.type !== 'image' && renderExtraActions()}
    </div>
  );
}
