// js/panchang.js
import { TAMIL_MONTHS, NAKSHATRAS, TITHIS } from './config.js';

export function calculatePanchangam(lat, lng) {
  const now = new Date();
  const observer = new Astronomy.Observer(lat, lng, 0);

  // GeoVectors for Sun and Moon
  const sunVector = Astronomy.GeoVector(Astronomy.Body.Sun, now, true);
  const moonVector = Astronomy.GeoVector(Astronomy.Body.Moon, now, true);

  const sunEcl = Astronomy.Ecliptic(sunVector);
  const moonEcl = Astronomy.Ecliptic(moonVector);

  // --- 1. Tamil Month Calculation (Sun's Sidereal Longitude) ---
  // Subtracting Lahiri Ayanamsa (~24.1 deg) to get Nirayana Sidereal Sun Position
  let siderealSun = (sunEcl.elon - 24.1) % 360;
  if (siderealSun < 0) siderealSun += 360;
  
  // Each Rasi (Zodiac Sign) = 30 degrees (360 / 12)
  const monthIndex = Math.floor(siderealSun / 30);
  const tamilMonth = TAMIL_MONTHS[monthIndex];
  
  const monthElement = document.getElementById("tamil-month-val");
  if (monthElement) {
    monthElement.innerText = `${tamilMonth.en} (${tamilMonth.ta})`;
  }

  // --- 2. Nakshatram Calculation (Moon's Sidereal Longitude) ---
  let siderealMoon = (moonEcl.elon - 24.1) % 360;
  if (siderealMoon < 0) siderealMoon += 360;
  
  // Each Nakshatram = 13.333 degrees (360 / 27)
  const nakshatraIndex = Math.floor(siderealMoon / (360 / 27));
  const nakshatra = NAKSHATRAS[nakshatraIndex];
  
  document.getElementById("nakshatra-val").innerText = `${nakshatra.en} - ${nakshatra.ta}`;

  // --- 3. Tithi Calculation ---
  let angleDiff = moonEcl.elon - sunEcl.elon;
  if (angleDiff < 0) angleDiff += 360;
  
  const tithiIndex = Math.floor(angleDiff / 12) % 15;
  const paksha = angleDiff < 180 ? "Shukla Paksha" : "Krishna Paksha";
  document.getElementById("tithi-val").innerText = `${TITHIS[tithiIndex]} (${paksha})`;

  // --- 4. Sunrise / Sunset ---
  const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, now, 1);
  const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, now, 1);

  if (sunrise && sunset) {
    const riseStr = sunrise.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const setStr = sunset.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById("sun-times").innerText = `${riseStr} / ${setStr}`;
  }
}