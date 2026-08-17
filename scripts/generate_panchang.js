/**
 * scripts/generate-panchang.js
 * Computes daily Panchangam details and outputs to data/dynamic-events.json
 * Compatible with Node.js and GitHub Actions workflows.
 */

const fs = require('fs');
const path = require('path');
const Astronomy = require('astronomy-engine');

// Import configuration values (using relative paths from scripts/)
const { DEFAULT_COORDS, TAMIL_MONTHS, NAKSHATRAS, TITHIS } = require('../js/config.js');

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