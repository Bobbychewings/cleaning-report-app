import React, { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Image, ChevronRight, LogOut, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function StaffDashboard() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { signOut, currentUser } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar - Mobile friendly */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-primary-600">Event Space App</h1>
          <p className="text-xs text-gray-500">Welcome, {currentUser?.displayName || 'Staff'}</p>
        </div>
        <button
          onClick={signOut}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Location</h2>
          <p className="text-gray-600 text-sm">Choose an event space to begin your inspection and cleaning check.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow-sm">
            No locations available right now.
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => navigate(`/staff/audit/${loc.id}`)}
                className="w-full flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow active:bg-gray-50 text-left"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 flex-shrink-0 relative">
                  {loc.imageUrl ? (
                    <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="text-gray-400 w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{loc.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin size={14} className="mr-1" />
                      Tap to start audit
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
