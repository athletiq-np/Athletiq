import React, { useEffect, useState } from "react";
import axios from "axios";

export default function LocationStep({ onNext }) {
  const [locations, setLocations] = useState([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/location/nepal")
      .then(res => {
        // If your JSON root is an object with "provinceList", adjust accordingly
        setLocations(res.data.provinceList || res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const provinces = locations;
  const districts =
    province && provinces.length
      ? provinces.find(p => p.name === province)?.districtList || []
      : [];
  const municipalities =
    district && districts.length
      ? districts.find(d => d.name === district)?.municipalityList || []
      : [];

  if (loading) return <div>Loading locations...</div>;

  return (
    <div>
      <label>Province</label>
      <select
        value={province}
        onChange={e => {
          setProvince(e.target.value);
          setDistrict("");
          setMunicipality("");
        }}
      >
        <option value="">Select Province</option>
        {provinces.map(p => (
          <option key={p.id} value={p.name}>{p.name}</option>
        ))}
      </select>

      <label>District</label>
      <select
        value={district}
        onChange={e => {
          setDistrict(e.target.value);
          setMunicipality("");
        }}
        disabled={!province}
      >
        <option value="">Select District</option>
        {districts.map(d => (
          <option key={d.id} value={d.name}>{d.name}</option>
        ))}
      </select>

      <label>Municipality/VDC</label>
      <select
        value={municipality}
        onChange={e => setMunicipality(e.target.value)}
        disabled={!district}
      >
        <option value="">Select Municipality/VDC</option>
        {municipalities.map(m => (
          <option key={m.id} value={m.name}>{m.name}</option>
        ))}
      </select>

      {/* Add free-text ward and tole fields here */}
      <button
        onClick={() =>
          onNext({ province, district, municipality })
        }
        disabled={!municipality}
      >
        Next
      </button>
    </div>
  );
}
