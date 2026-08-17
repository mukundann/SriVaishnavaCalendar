/**
 * scripts/generate-panchang.js
 * Computes daily Panchangam details and outputs to data/todays-panchangam.json
 */
const fs = require('fs');
const path = require('path');
const Astronomy = require('astronomy-engine');

//const DEFAULT_COORDS = { lat: 13.0827, lng: 80.2707 }; -- Chennai
const DEFAULT_COORDS = { lat: 37.3394, lng: -121.8950 };

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

function calculatePanchangam(lat, lng, date = new Date()) {
    const now = Astronomy.MakeTime(date);
    const observer = new Astronomy.Observer(lat, lng, 0);

    const sunVector = Astronomy.GeoVector(Astronomy.Body.Sun, now, true);
    const moonVector = Astronomy.GeoVector(Astronomy.Body.Moon, now, true);

    const sunEcl = Astronomy.Ecliptic(sunVector);
    const moonEcl = Astronomy.Ecliptic(moonVector);

    // 1. Tamil Month
    let siderealSun = (sunEcl.elon - 24.1) % 360;
    if (siderealSun < 0) siderealSun += 360;
    const monthIndex = Math.floor(siderealSun / 30);
    const tamilMonthObj = TAMIL_MONTHS[monthIndex] || TAMIL_MONTHS[0];
    const tamilDate = Math.floor(siderealSun % 30) + 1;

    // 2. Nakshatram
    let siderealMoon = (moonEcl.elon - 24.1) % 360;
    if (siderealMoon < 0) siderealMoon += 360;
    const nakshatraIndex = Math.floor(siderealMoon / (360 / 27));
    const nakshatra = NAKSHATRAS[nakshatraIndex] || NAKSHATRAS[0];

    // 3. Tithi
    let angleDiff = moonEcl.elon - sunEcl.elon;
    if (angleDiff < 0) angleDiff += 360;
    const tithiIndex = Math.floor(angleDiff / 12) % 15;
    const paksha = angleDiff < 180 ? "Shukla Paksha" : "Krishna Paksha";

    let tithiName = TITHIS[tithiIndex] ? TITHIS[tithiIndex].en : "Tithi";
    if (tithiIndex === 14 && paksha === "Krishna Paksha") {
        tithiName = TITHIS[tithiIndex].amavasya_en || "Amavasya";
    }
    const fullTithiStr = `${paksha} ${tithiName}`;

    // 4. Sunrise and Sunset (Corrected Logic)
    // Start search from local midnight by resetting hours relative to local target
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const searchStart = Astronomy.MakeTime(startOfDay);

    // Direction +1 with limit 1 day finds next upcoming event from start of day
    const sunriseObj = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, searchStart, 1);

    // Find sunset after sunrise
    const sunsetStart = sunriseObj ? sunriseObj.date : searchStart;
    const sunsetObj = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, Astronomy.MakeTime(sunsetStart), 1);

    const formatTime = (timeObj) => {
        if (!timeObj || !timeObj.date) return "--:--";

        // Pass targeted time zone (e.g., 'Asia/Kolkata' or 'America/Los_Angeles')
        return timeObj.date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles' // Adjust to target location time zone
        });
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

function main() {
    console.log(`Generating Panchangam data for coordinates (${DEFAULT_COORDS.lat}, ${DEFAULT_COORDS.lng})...`);
    const panchangData = calculatePanchangam(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, new Date());

    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'todays-panchangam.json');
    fs.writeFileSync(outputPath, JSON.stringify(panchangData, null, 2), 'utf-8');

    console.log(`Successfully saved to: ${outputPath}`);
}

main();