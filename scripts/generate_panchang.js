/**
 * scripts/generate-panchang.js
 * Computes daily Panchangam details and outputs to data/dynamic-events.json
 * Compatible with Node.js and GitHub Actions workflows.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Astronomy from 'astronomy-engine';
const Astronomy = require('astronomy-engine');

// Import configuration values (using relative paths from scripts/)

const GITHUB_JSON_URL = "https://raw.githubusercontent.com/mukundann/SriVaishnavaCalendar/refs/heads/main/data/dynamic-events.json";

const DEFAULT_COORDS = { lat: 13.0827, lng: 80.2707 };

// 12 Tamil Months with Tamil Script
const TAMIL_MONTHS = [
    { en: "Chithirai", ta: "சித்திரை" },
    { en: "Vaikasi", ta: "வைகாசி" },
    { en: "Aani", ta: "ஆனி" },
    { en: "Aadi", ta: "ஆடி" },
    { en: "Avani", ta: "ஆவணி" },
    { en: "Purattasi", ta: "புரட்டாசி" },
    { en: "Aippasi", ta: "ஐப்பசி" },
    { en: "Karthigai", ta: "கார்த்திகை" },
    { en: "Margazhi", ta: "மார்கழி" },
    { en: "Thai", ta: "தை" },
    { en: "Maasi", ta: "மாசி" },
    { en: "Panguni", ta: "பங்குனி" }
];

// 27 Nakshatrams (Bilingual)
const NAKSHATRAS = [
    { en: "Ashwini", ta: "அசுவினி" },
    { en: "Bharani", ta: "பரணி" },
    { en: "Krittika", ta: "கார்த்திகை" },
    { en: "Rohini", ta: "ரோகிணி" },
    { en: "Mrigashirsha", ta: "மிருகசீரிடம்" },
    { en: "Thiruvadhirai / Arudra", ta: "திருவாதிரை" },
    { en: "Punarvasu", ta: "புனர்பூசம்" },
    { en: "Pushya / Poosam", ta: "பூசம்" },
    { en: "Ashlesha / Ayilyam", ta: "ஆயில்யம்" },
    { en: "Magha / Makam", ta: "மகம்" },
    { en: "Purva Phalguni / Pooram", ta: "பூரம்" },
    { en: "Uttara Phalguni / Uthiram", ta: "உத்திரம்" },
    { en: "Hasta / Hastham", ta: "அஸ்தம்" },
    { en: "Chitra / Chithirai", ta: "சித்திரை" },
    { en: "Swati", ta: "சுவாதி" },
    { en: "Vishakha / Visakam", ta: "விசாகம்" },
    { en: "Anuradha / Anusham", ta: "அனுஷம்" },
    { en: "Jyeshtha / Kettai", ta: "கேட்டை" },
    { en: "Mula / Moolam", ta: "மூலம்" },
    { en: "Purva Ashadha / Pooradam", ta: "பூராடம்" },
    { en: "Uttara Ashadha / Uthiradam", ta: "உத்திராடம்" },
    { en: "Shravana / Thiruvonam", ta: "திருவோணம்" },
    { en: "Dhanishta / Avittam", ta: "அவிட்டம்" },
    { en: "Shatabhisha / Sadhayam", ta: "சதயம்" },
    { en: "Purva Bhadrapada / Purattathi", ta: "பூரட்டாதி" },
    { en: "Uttara Bhadrapada / Uthirattathi", ta: "உத்திரட்டாதி" },
    { en: "Revati", ta: "ரேவதி" }
];

// 15 Tithis (Bilingual)
const TITHIS = [
    { en: "Prathama", ta: "பிரதமை" },
    { en: "Dwitiya", ta: "துவிதியை" },
    { en: "Tritiya", ta: "திருதியை" },
    { en: "Chaturthi", ta: "சதுர்த்தி" },
    { en: "Panchami", ta: "பஞ்சமி" },
    { en: "Shasthi", ta: "சஷ்டி" },
    { en: "Saptami", ta: "சப்தமி" },
    { en: "Ashtami", ta: "அஷ்டமி" },
    { en: "Navami", ta: "நவமி" },
    { en: "Dashami", ta: "தசமி" },
    { en: "Ekadasi", ta: "ஏகாதசி" },
    { en: "Dwadasi", ta: "துவாதசி" },
    { en: "Trayodasi", ta: "திரயோதசி" },
    { en: "Chaturdashi", ta: "சதுர்தசி" },
    { en: "Purnima", ta: "பௌர்ணமி", amavasya_en: "Amavasya", amavasya_ta: "அமாவாசை" }
];



/**
 * Calculates local Panchangam parameters for a given date and location.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Date} date - JavaScript Date object (defaults to current time)
 * @returns {Object|null} Calculated Panchangam details
 */
function calculatePanchangam(lat, lng, date = new Date()) {
    if (typeof Astronomy === 'undefined') {
        console.error("Astronomy Engine library not loaded.");
        return null;
    }

    const now = Astronomy.MakeTime(date);
    const observer = new Astronomy.Observer(lat, lng, 0);

    const sunVector = Astronomy.GeoVector(Astronomy.Body.Sun, now, true);
    const moonVector = Astronomy.GeoVector(Astronomy.Body.Moon, now, true);

    const sunEcl = Astronomy.Ecliptic(sunVector);
    const moonEcl = Astronomy.Ecliptic(moonVector);

    // 1. Tamil Month Calculation
    let siderealSun = (sunEcl.elon - 24.1) % 360;
    if (siderealSun < 0) siderealSun += 360;
    const monthIndex = Math.floor(siderealSun / 30);
    const tamilMonthObj = TAMIL_MONTHS[monthIndex] || TAMIL_MONTHS[0];

    // Approximate solar date index within the month
    const tamilDate = Math.floor(siderealSun % 30) + 1;

    // 2. Nakshatram Calculation
    let siderealMoon = (moonEcl.elon - 24.1) % 360;
    if (siderealMoon < 0) siderealMoon += 360;
    const nakshatraIndex = Math.floor(siderealMoon / (360 / 27));
    const nakshatra = NAKSHATRAS[nakshatraIndex] || NAKSHATRAS[0];

    // 3. Tithi Calculation
    let angleDiff = moonEcl.elon - sunEcl.elon;
    if (angleDiff < 0) angleDiff += 360;
    const tithiIndex = Math.floor(angleDiff / 12) % 15;
    const paksha = angleDiff < 180 ? "Shukla Paksha" : "Krishna Paksha";

    let tithiName = TITHIS && TITHIS[tithiIndex] ? TITHIS[tithiIndex].en : "Tithi";
    if (tithiIndex === 14 && paksha === "Krishna Paksha") {
        tithiName = TITHIS[tithiIndex].amavasya_en || "Amavasya";
    }
    const fullTithiStr = `${paksha} ${tithiName}`;

    // 4. Sunrise and Sunset times
    const sunriseObj = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, now, 1);
    const sunsetObj = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, now, 1);

    const formatTime = (timeObj) => {
        if (!timeObj || !timeObj.date) return "--:--";
        return timeObj.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return {
        date: date.toISOString().split('T')[0],
        tamilMonth: tamilMonthObj.en,
        tamilMonthTa: tamilMonthObj.ta,
        tamilDate: tamilDate,
        nakshatram: nakshatra.en,
        nakshatramTa: nakshatra.ta,
        tithi: fullTithiStr,
        sunrise: formatTime(sunriseObj),
        sunset: formatTime(sunsetObj),
        location: `Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`,
        updatedAt: new Date().toISOString()
    };
}


// If you need __dirname in an ES module environment:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Execute Generation & Write to File
function main() {
    console.log(`Generating Panchangam data for default coordinates (${DEFAULT_COORDS.lat}, ${DEFAULT_COORDS.lng})...`);
    const panchangData = calculatePanchangam(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, new Date());

    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'todays-panchangam.json');
    fs.writeFileSync(outputPath, JSON.stringify(panchangData, null, 2), 'utf-8');

    console.log(`Successfully generated and saved to: ${outputPath}`);
    console.log(JSON.stringify(panchangData, null, 2));
}

main();