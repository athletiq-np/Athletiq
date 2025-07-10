// src/components/tournament/VenueManagement.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaWifi, FaParking, 
  FaRestroom, FaUtensils, FaAccessibleIcon, FaMapPin, FaPhone, 
  FaEnvelope, FaClock, FaUsers, FaInfoCircle, FaCamera, FaFileAlt
} from 'react-icons/fa';

const VenueManagement = ({ tournament, onUpdate, currentUser }) => {
  const [venues, setVenues] = useState(tournament?.venues || []);
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [editingVenue, setEditingVenue] = useState(null);

  const [newVenue, setNewVenue] = useState({
    name: '',
    address: '',
    capacity: '',
    description: '',
    facilities: [],
    contact: {
      phone: '',
      email: '',
      manager: ''
    },
    operatingHours: {
      start: '08:00',
      end: '20:00'
    },
    images: [],
    notes: ''
  });

  const facilityOptions = [
    { id: 'wifi', label: 'Wi-Fi', icon: FaWifi },
    { id: 'parking', label: 'Parking', icon: FaParking },
    { id: 'restrooms', label: 'Restrooms', icon: FaRestroom },
    { id: 'food', label: 'Food Court', icon: FaUtensils },
    { id: 'accessible', label: 'Accessible', icon: FaAccessibleIcon },
    { id: 'firstAid', label: 'First Aid', icon: FaInfoCircle },
    { id: 'security', label: 'Security', icon: FaInfoCircle },
    { id: 'storage', label: 'Storage', icon: FaInfoCircle }
  ];

  const handleAddVenue = () => {
    if (newVenue.name && newVenue.address) {
      const venue = {
        id: Date.now().toString(),
        ...newVenue,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id
      };
      
      const updatedVenues = [...venues, venue];
      setVenues(updatedVenues);
      
      if (onUpdate) {
        onUpdate({ venues: updatedVenues });
      }
      
      setNewVenue({
        name: '',
        address: '',
        capacity: '',
        description: '',
        facilities: [],
        contact: { phone: '', email: '', manager: '' },
        operatingHours: { start: '08:00', end: '20:00' },
        images: [],
        notes: ''
      });
      setShowAddVenue(false);
    }
  };

  const handleEditVenue = (venue) => {
    setEditingVenue(venue);
    setNewVenue({ ...venue });
    setShowAddVenue(true);
  };

  const handleUpdateVenue = () => {
    if (editingVenue) {
      const updatedVenues = venues.map(v => 
        v.id === editingVenue.id ? { ...newVenue, id: editingVenue.id } : v
      );
      setVenues(updatedVenues);
      
      if (onUpdate) {
        onUpdate({ venues: updatedVenues });
      }
      
      setEditingVenue(null);
      setNewVenue({
        name: '',
        address: '',
        capacity: '',
        description: '',
        facilities: [],
        contact: { phone: '', email: '', manager: '' },
        operatingHours: { start: '08:00', end: '20:00' },
        images: [],
        notes: ''
      });
      setShowAddVenue(false);
    }
  };

  const handleDeleteVenue = (venueId) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      const updatedVenues = venues.filter(v => v.id !== venueId);
      setVenues(updatedVenues);
      
      if (onUpdate) {
        onUpdate({ venues: updatedVenues });
      }
    }
  };

  const handleFacilityToggle = (facilityId) => {
    const updatedFacilities = newVenue.facilities.includes(facilityId)
      ? newVenue.facilities.filter(f => f !== facilityId)
      : [...newVenue.facilities, facilityId];
    
    setNewVenue(prev => ({ ...prev, facilities: updatedFacilities }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FaMapMarkerAlt className="text-2xl text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Venue Management</h2>
            <p className="text-gray-600">Manage tournament venues and locations</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddVenue(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add Venue</span>
        </button>
      </div>

      {/* Venues List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <motion.div
            key={venue.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {venue.name}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <FaMapPin className="mr-2" />
                    <span className="text-sm">{venue.address}</span>
                  </div>
                  {venue.capacity && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaUsers className="mr-2" />
                      <span className="text-sm">Capacity: {venue.capacity}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditVenue(venue)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteVenue(venue.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {venue.description && (
                <p className="text-gray-600 text-sm mb-4">{venue.description}</p>
              )}

              {/* Facilities */}
              {venue.facilities && venue.facilities.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Facilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {venue.facilities.map((facilityId) => {
                      const facility = facilityOptions.find(f => f.id === facilityId);
                      return facility ? (
                        <div key={facilityId} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                          <facility.icon />
                          <span>{facility.label}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Operating Hours */}
              <div className="flex items-center text-gray-600 text-sm mb-4">
                <FaClock className="mr-2" />
                <span>{venue.operatingHours?.start} - {venue.operatingHours?.end}</span>
              </div>

              {/* Contact Info */}
              {venue.contact && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact</h4>
                  {venue.contact.manager && (
                    <p className="text-sm text-gray-600 mb-1">Manager: {venue.contact.manager}</p>
                  )}
                  {venue.contact.phone && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <FaPhone className="mr-2" />
                      {venue.contact.phone}
                    </div>
                  )}
                  {venue.contact.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaEnvelope className="mr-2" />
                      {venue.contact.email}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {venues.length === 0 && (
        <div className="text-center py-12">
          <FaMapMarkerAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Venues Added</h3>
          <p className="text-gray-500 mb-4">Add your first venue to get started</p>
          <button
            onClick={() => setShowAddVenue(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Venue
          </button>
        </div>
      )}

      {/* Add/Edit Venue Modal */}
      {showAddVenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {editingVenue ? 'Edit Venue' : 'Add New Venue'}
              </h3>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      value={newVenue.name}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter venue name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={newVenue.capacity}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, capacity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter capacity"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={newVenue.address}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newVenue.description}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter venue description"
                  />
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facilities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {facilityOptions.map((facility) => (
                      <label key={facility.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newVenue.facilities.includes(facility.id)}
                          onChange={() => handleFacilityToggle(facility.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <facility.icon className="text-sm" />
                        <span className="text-sm">{facility.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Operating Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operating Hours
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={newVenue.operatingHours.start}
                        onChange={(e) => setNewVenue(prev => ({ 
                          ...prev, 
                          operatingHours: { ...prev.operatingHours, start: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Time</label>
                      <input
                        type="time"
                        value={newVenue.operatingHours.end}
                        onChange={(e) => setNewVenue(prev => ({ 
                          ...prev, 
                          operatingHours: { ...prev.operatingHours, end: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Manager</label>
                      <input
                        type="text"
                        value={newVenue.contact.manager}
                        onChange={(e) => setNewVenue(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, manager: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Manager name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={newVenue.contact.phone}
                        onChange={(e) => setNewVenue(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={newVenue.contact.email}
                        onChange={(e) => setNewVenue(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, email: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={newVenue.notes}
                    onChange={(e) => setNewVenue(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Any additional notes about the venue"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddVenue(false);
                    setEditingVenue(null);
                    setNewVenue({
                      name: '',
                      address: '',
                      capacity: '',
                      description: '',
                      facilities: [],
                      contact: { phone: '', email: '', manager: '' },
                      operatingHours: { start: '08:00', end: '20:00' },
                      images: [],
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingVenue ? handleUpdateVenue : handleAddVenue}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingVenue ? 'Update' : 'Add'} Venue
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VenueManagement;
