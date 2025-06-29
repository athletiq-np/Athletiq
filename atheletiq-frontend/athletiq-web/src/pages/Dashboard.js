// src/pages/Dashboard.js

import React, { useState, useEffect } from "react";
import { fetchTournaments, createTournament } from "../api/tournamentApi";
import TournamentList from "../components/TournamentList";
import TournamentForm from "../components/TournamentCreateForm.js";

const Dashboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);

  // For demo: store token in localStorage after login
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user")); // Assuming user info (including org_id) is stored in localStorage after login

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTournaments(token, user.organization_id);
        setTournaments(data);
      } catch (err) {
        alert(err.message);
      }
    }
    if (token && user) load();
  }, [token, user]);

  async function handleCreate(form) {
    setLoading(true);
    try {
      await createTournament(form, token, user.organization_id);
      const data = await fetchTournaments(token, user.organization_id);
      setTournaments(data);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <TournamentForm onSubmit={handleCreate} loading={loading} />
      <TournamentList tournaments={tournaments} />
    </div>
  );
};

export default Dashboard;
