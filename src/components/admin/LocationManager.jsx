import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Image, Trash2, Edit } from 'lucide-react';

export default function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      const querySnapshot = await getDocs(collection(db, 'locations'));
      const locList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLocations(locList);
    } catch (error) {
      console.error("Error fetching locations: ", error);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(location = null) {
    if (location) {
      setEditingLocation(location);
      setName(location.name);
      setImageFile(null);
    } else {
      setEditingLocation(null);
      setName('');
      setImageFile(null);
    }
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = editingLocation ? editingLocation.imageUrl : null;

      // Upload image if a new one is selected
      if (imageFile) {
        const storageRef = ref(storage, `locations/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const locationData = {
        name,
        imageUrl,
        updatedAt: new Date().toISOString()
      };

      if (editingLocation) {
        // Update
        const locRef = doc(db, 'locations', editingLocation.id);
        await updateDoc(locRef, locationData);
      } else {
        // Create
        locationData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'locations'), locationData);
      }

      setShowModal(false);
      fetchLocations();
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Failed to save location");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if(window.confirm("Are you sure you want to delete this location?")) {
      try {
        await deleteDoc(doc(db, 'locations', id));
        fetchLocations();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  }

  if (loading) return <div>Loading locations...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Locations</h3>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition"
        >
          Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {locations.map((loc) => (
          <div key={loc.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white">
            <div className="h-40 bg-gray-200 flex items-center justify-center relative group">
              {loc.imageUrl ? (
                <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
              ) : (
                <Image className="w-12 h-12 text-gray-400" />
              )}
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition">
                <button onClick={() => handleOpenModal(loc)} className="text-white hover:text-blue-300 p-2"><Edit size={24} /></button>
                <button onClick={() => handleDelete(loc.id)} className="text-white hover:text-red-300 p-2"><Trash2 size={24} /></button>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-lg">{loc.name}</h4>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">No locations added yet.</div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingLocation ? 'Edit Location' : 'Add Location'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
