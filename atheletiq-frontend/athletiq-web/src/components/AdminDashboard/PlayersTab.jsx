import React from "react";
import AddPlayerModal from "../modals/AddPlayerModal";
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
      {/* Top Bar with Filters + Buttons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-athletiq-navy">All Players</h2>
        <div className="flex gap-3 items-center">
          {/* School Filter for Super Admin */}
          {user.role === "super_admin" && (
            <select
              className="border p-2 rounded"
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
            >
              <option value="">All Schools</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {/* Actions */}
          <button onClick={() => setAddPlayerOpen(true)} className="px-4 py-2 bg-athletiq-green text-white rounded">
            + Add Player
          </button>
          <button
            onClick={() => setBulkPlayerOpen(true)}
            disabled={user.role === "super_admin" && !selectedSchoolId}
            className="px-4 py-2 bg-athletiq-blue text-white rounded"
          >
            Bulk Upload
          </button>
          <button
            onClick={handleBulkDeletePlayers}
            disabled={selectedPlayerIds.length === 0}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Delete Selected
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-athletiq-blue text-white">
              <th className="p-2">
                <input
                  type="checkbox"
                  checked={selectedPlayerIds.length > 0 && selectedPlayerIds.length === players.length}
                  onChange={handleSelectAllPlayers}
                />
              </th>
              <th className="p-2 text-left">Player</th>
              <th className="p-2 text-left">School</th>
              <th className="p-2 text-left">DOB</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr
                key={p.id}
                className="border-b hover:bg-gray-50 transition cursor-pointer"
                onClick={(e) => {
                  // Block row click if buttons/checkbox clicked
                  if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT" || e.target.closest("button")) return;
                  setViewPlayer(p);
                }}
              >
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.includes(p.id)}
                    onChange={() => togglePlayerSelection(p.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="p-3 flex items-center gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewPlayer(p);
                    }}
                    className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-athletiq-green transition"
                    title="Click to view player"
                  >
                    <img
                      src={`http://localhost:5000/uploads/${p.photo || "default.png"}`}
                      alt={p.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-medium text-athletiq-navy">{p.full_name}</span>
                </td>
                <td className="p-2">{p.school_name || p.school_id}</td>
                <td className="p-2">{p.dob}</td>
                <td className="p-2">{p.guardian_phone || p.contact_no}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditPlayer(p);
                    }}
                    className="bg-athletiq-green text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlayer(p.id);
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddPlayerModal
        open={addPlayerOpen}
        onClose={() => setAddPlayerOpen(false)}
        onAdded={reloadPlayers}
        schools={schools}
        defaultSchoolId={user.role === "school_admin" ? user.school_id : undefined}
      />
      <EditPlayerModal
        open={!!editPlayer}
        player={editPlayer}
        onClose={() => setEditPlayer(null)}
        schools={schools}
        onUpdated={reloadPlayers}
      />
      <ViewPlayerModal
        open={!!viewPlayer}
        player={viewPlayer}
        onClose={() => setViewPlayer(null)}
      />
      <BulkPlayerUploadModal
        open={bulkPlayerOpen}
        onClose={() => setBulkPlayerOpen(false)}
        onUploaded={reloadPlayers}
        schoolId={user.role === "super_admin" ? selectedSchoolId : undefined}
      />
    </div>
  );
}
