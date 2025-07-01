import React, { useState } from "react";
import axios from "axios";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { LoadScript } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

// TODO: Replace with your own Google Maps API Key!
const GOOGLE_MAPS_API_KEY = "YOUR_REAL_API_KEY_HERE"; // <-- PASTE YOUR KEY

export default function Register() {
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: {
      // Optionally restrict to Nepal: componentRestrictions: { country: "np" }
    }
  });

  // When a place/school is picked from autocomplete
  const handleSelect = async (suggestion) => {
    setValue(suggestion.description, false);
    clearSuggestions();
    setSchoolName(suggestion.structured_formatting.main_text);
    setPlaceId(suggestion.place_id);
    try {
      const results = await getGeocode({ address: suggestion.description });
      setAddress(results[0].formatted_address);
      const { lat, lng } = await getLatLng(results[0]);
      setLocationLat(lat);
      setLocationLng(lng);
    } catch (e) {
      setErr("Could not get location from Google Maps.");
    }
  };

  // Handle submit
  const handleRegister = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");
    setLoading(true);
    try {
      if (!schoolName || !address || !locationLat || !locationLng) {
        setErr("Please select your school from Google Maps search.");
        setLoading(false);
        return;
      }
      await axios.post("http://localhost:5000/api/school/register", {
        school_name: schoolName,
        admin_name: adminName,
        address,
        location_lat: locationLat,
        location_lng: locationLng,
        place_id: placeId,
        email,
        password,
      });
      setSuccess("School admin registered! You can login now.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setErr(error?.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <form className="bg-white p-8 rounded shadow w-full max-w-md" onSubmit={handleRegister}>
          <h2 className="text-xl font-bold mb-4">Register School Admin</h2>
          <label className="block mb-1">Search School Name & Address (Google Maps):</label>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            // disabled={!ready}   // <-- disabled removed so you can always type
            className="w-full border p-2 mb-2"
            placeholder="Start typing school name or address..."
            autoComplete="off"
          />
          {status === "OK" && (
            <ul className="bg-white border rounded shadow max-h-48 overflow-auto mb-2">
              {data.map((suggestion) => (
                <li
                  key={suggestion.place_id}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleSelect(suggestion)}
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          )}
          {/* Display picked data */}
          <input className="w-full border p-2 mb-2" placeholder="School Name" value={schoolName} readOnly />
          <input className="w-full border p-2 mb-2" placeholder="Address" value={address} readOnly />
          {/* Hidden lat/lng/ID */}
          <input type="hidden" value={locationLat} />
          <input type="hidden" value={locationLng} />
          <input
            className="w-full border p-2 mb-2"
            placeholder="Admin Full Name"
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            required
          />
          <input
            className="w-full border p-2 mb-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border p-2 mb-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {err && <div className="text-red-500 mb-2">{err}</div>}
          {success && <div className="text-green-500 mb-2">{success}</div>}
          <button className="w-full py-2 bg-green-500 text-white rounded" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
          <div className="mt-4 text-sm">
            Already have an account?{" "}
            <span className="text-blue-600 underline cursor-pointer" onClick={() => navigate("/login")}>
              Login here
            </span>
          </div>
        </form>
      </div>
    </LoadScript>
  );
}

/*
  ONBOARDING NOTES:
  - School name and address are selected using Google Maps Autocomplete for verified data.
  - User types in the top input (not read-only!) and clicks a Google suggestion.
  - The picked school name and address are displayed in read-only fields below.
  - Lat/Lng/Place ID are hidden but sent to backend for strict registration.
  - Replace GOOGLE_MAPS_API_KEY with your real key (get from Google Cloud Console).
  - If the form won't type, check your API key and console for Google errors.
*/
