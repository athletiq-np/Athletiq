// src/components/AdminDashboard/PlayersTab.js
import React from "react";
import AddPlayerModal from "../AddPlayerModal";
import EditPlayerModal from "../EditPlayerModal";
import ViewPlayerModal from "../ViewPlayerModal";
import BulkPlayerUploadModal from "../BulkPlayerUploadModal";

export default function PlayersTab({
  players, schools, user,
  selectedSchoolId, setSelectedSchoolId,
  addPlayerOpen, setAddPlayerOpen,
  bulkPlayerOpen, setBulkPlayerOpen,
  editPlayer, setEditPlayer,
  viewPlayer, setViewPlayer,
  selectedPlayerIds, setSelectedPlayerIds,
  handleDeletePlayer, handleBulkDeletePlayers, togglePlayerSelection, handleSelectAllPlayers, reloadPlayers
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-athletiq-navy">All Players</h2>
        <div className="flex gap-3 items-center">
          {user.role === "super_admin" && (
            <select className="border p-2" value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)}>
              <option value="">All Schools</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button onClick={() => setAddPlayerOpen(true)} className="px-4 py-2 bg-athletiq-green text-white rounded">+ Add Player</button>
          <button onClick={() => setBulkPlayerOpen(true)} disabled={user.role === "super_admin" && !selectedSchoolId} className="px-4 py-2 bg-athletiq-blue text-white rounded">Bulk Upload</button>
          <button onClick={handleBulkDeletePlayers} disabled={selectedPlayerIds.length === 0} className="px-4 py-2 bg-red-500 text-white rounded">Delete Selected</button>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-athletiq-blue text-white">
              <th className="p-2"><input type="checkbox" checked={selectedPlayerIds.length > 0 && selectedPlayerIds.length === players.length} onChange={handleSelectAllPlayers} /></th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">School</th>
              <th className="p-2 text-left">DOB</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2">
                  <input type="checkbox" checked={selectedPlayerIds.includes(p.id)} onChange={() => togglePlayerSelection(p.id)} />
                </td>
                <td className="p-2">{p.full_name}</td>
                <td className="p-2">{p.school_name || p.school_id}</td>
                <td className="p-2">{p.dob}</td>
                <td className="p-2">{p.guardian_phone || p.contact_no}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setViewPlayer(p)} className="bg-athletiq-blue text-white px-3 py-1 rounded">View</button>
                  <button onClick={() => setEditPlayer(p)} className="bg-athletiq-green text-white px-3 py-1 rounded">Edit</button>
                  <button onClick={() => handleDeletePlayer(p.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddPlayerModal open={addPlayerOpen} onClose={() => setAddPlayerOpen(false)} onAdded={reloadPlayers} schools={schools} defaultSchoolId={user.role === "school_admin" ? user.school_id : undefined} />
      <EditPlayerModal open={!!editPlayer} player={editPlayer} onClose={() => setEditPlayer(null)} schools={schools} onUpdated={reloadPlayers} />
      <ViewPlayerModal open={!!viewPlayer} player={viewPlayer} onClose={() => setViewPlayer(null)} />
      <BulkPlayerUploadModal open={bulkPlayerOpen} onClose={() => setBulkPlayerOpen(false)} onUploaded={reloadPlayers} schoolId={user.role === "super_admin" ? selectedSchoolId : undefined} />
    </div>
  );
}
