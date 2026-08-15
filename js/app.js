import { DEFAULT_COORDS } from './config.js';
import { calculatePanchangam } from './panchang.js';
import { fetchGitHubEvents } from './storage.js';

let userCoords = { ...DEFAULT_COORDS };

// Clock Engine
function updateTime() {
    const now = new Date();
    const liveTimeEl = document.getElementById("live-time");
    const gregDateEl = document.getElementById("gregorian-date");

    if (liveTimeEl) liveTimeEl.innerText = now.toLocaleTimeString();
    if (gregDateEl) {
        gregDateEl.innerText = now.toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

// Update Panchang Details on UI
function updatePanchangUI(lat, lng) {
    const panchang = calculatePanchangam(lat, lng);
    if (!panchang) return;

    const monthEl = document.getElementById("tamil-month-val");
    const dateEl = document.getElementById("tamil-date-val");
    const nakshatraEl = document.getElementById("nakshatra-val");
    const tithiEl = document.getElementById("tithi-val");
    const sunTimesEl = document.getElementById("sun-times");

    if (monthEl) monthEl.innerText = `${panchang.tamilMonth} (${panchang.tamilMonthTa}) ${panchang.tamilDate}`;
    if (nakshatraEl) nakshatraEl.innerText = `${panchang.nakshatram} (${panchang.nakshatramTa})`;
    if (tithiEl) tithiEl.innerText = panchang.tithi;
    if (sunTimesEl) sunTimesEl.innerText = panchang.sunrise;
    if (sunTimesEl) sunTimesEl.innerText = panchang.sunset;
}

// Location Engine
function initLocation() {
    const locationNameEl = document.getElementById("location-name");

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                userCoords.lat = pos.coords.latitude;
                userCoords.lng = pos.coords.longitude;
                if (locationNameEl) {
                    locationNameEl.innerText = `📍 ${userCoords.lat.toFixed(2)}°, ${userCoords.lng.toFixed(2)}°`;
                }
                updatePanchangUI(userCoords.lat, userCoords.lng);
            },
            (err) => {
                if (locationNameEl) locationNameEl.innerText = "📍 Default Location (Chennai)";
                updatePanchangUI(userCoords.lat, userCoords.lng);
            }
        );
    } else {
        if (locationNameEl) locationNameEl.innerText = "📍 Default Location (Chennai)";
        updatePanchangUI(userCoords.lat, userCoords.lng);
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