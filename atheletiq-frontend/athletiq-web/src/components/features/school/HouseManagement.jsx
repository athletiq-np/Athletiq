// src/components/features/school/HouseManagement.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBuilding, FaPlus, FaUsers, FaEdit, FaTrash, FaPalette } from 'react-icons/fa';

export default function HouseManagement({ houses, students, onRefresh }) {
  const mockHouses = [
    { id: 1, name: 'Red House', color: '#EF4444', students: 25, captain: 'Ram Thapa', logo: null },
    { id: 2, name: 'Blue House', color: '#3B82F6', students: 28, captain: 'Sita Sharma', logo: null },
    { id: 3, name: 'Green House', color: '#10B981', students: 22, captain: 'Arjun Khadka', logo: null },
    { id: 4, name: 'Yellow House', color: '#F59E0B', students: 30, captain: 'Maya Gurung', logo: null },
  ];

  const displayHouses = houses.length > 0 ? houses : mockHouses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Houses & Teams</h2>
          <p className="text-gray-600">Organize students into houses and manage teams</p>
        </div>
        <button className="bg-athletiq-blue text-white px-4 py-2 rounded-lg hover:bg-athletiq-navy transition-colors flex items-center space-x-2">
          <FaPlus className="h-4 w-4" />
          <span>Create House</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayHouses.map((house) => (
          <motion.div
            key={house.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: house.color }}
                  >
                    <FaBuilding className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{house.name}</h3>
                    <p className="text-sm text-gray-500">{house.students} students</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <FaEdit className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Captain:</span>
                  <span className="font-medium">{house.captain}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Members:</span>
                  <span className="font-medium">{house.students}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full text-sm text-athletiq-blue hover:bg-blue-50 py-2 rounded">
                  Manage Students
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
