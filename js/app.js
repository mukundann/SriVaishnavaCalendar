
import { DEFAULT_COORDS } from './config.js';
import { calculatePanchangam } from './panchang.js';

import { fetchGitHubEvents } from './storage.js';


let userCoords = { ...DEFAULT_COORDS };

// Clock Engine
function updateTime() {
  const now = new Date();
  document.getElementById("live-time").innerText = now.toLocaleTimeString();
  document.getElementById("gregorian-date").innerText = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Location Engine
function initLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords.lat = pos.coords.latitude;
        userCoords.lng = pos.coords.longitude;
        document.getElementById("location-name").innerText = 
          `📍 ${userCoords.lat.toFixed(2)}°, ${userCoords.lng.toFixed(2)}°`;
        calculatePanchangam(userCoords.lat, userCoords.lng);
      },
      (err) => {
        document.getElementById("location-name").innerText = "📍 Default Location (Chennai)";
        calculatePanchangam(userCoords.lat, userCoords.lng);
      }
    );
  } else {
    calculatePanchangam(userCoords.lat, userCoords.lng);
  }
}

// App Startup Sequence
document.addEventListener("DOMContentLoaded", () => {
  // Start clock
  setInterval(updateTime, 1000);
  updateTime();

  // Initialize Geolocation & Astronomical Calculations
  initLocation();

  // Fetch GitHub dynamic updates
  fetchGitHubEvents();

  // Refresh GitHub dynamic data every 10 minutes
  setInterval(fetchGitHubEvents, 600000);
});