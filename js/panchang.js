/**
 * js/panchang.js
 * Astronomical calculations for Tamil Solar Date, Tithi, and Nakshatram
 */

import { TAMIL_MONTHS, NAKSHATRAS, TITHIS } from './config.js';

/**
 * Calculates local Panchangam parameters for a given date and location.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Date} date - JavaScript Date object (defaults to current time)
 * @returns {Object|null} Calculated Panchangam details
 */
export function calculatePanchangam(lat, lng, date = new Date()) {
    if (typeof Astronomy === 'undefined') {
        console.error("Astronomy Engine library not loaded.");
        return null;
    }

    // Convert Date to Astronomy Time object
    const now = Astronomy.MakeTime(date);
    const observer = new Astronomy.Observer(lat, lng, 0);

    // Get Geocentric Vectors for Sun and Moon
    const sunVector = Astronomy.GeoVector(Astronomy.Body.Sun, now, true);
    const moonVector = Astronomy.GeoVector(Astronomy.Body.Moon, now, true);

    // Convert to Ecliptic Longitude
    const sunEcl = Astronomy.Ecliptic(sunVector);
    const moonEcl = Astronomy.Ecliptic(moonVector);

    // 1. Calculate Tamil Month (Sidhanta Nirayana Sun Longitude with ~24.1° Ayanamsa)
    let siderealSun = (sunEcl.elon - 24.1) % 360;
    if (siderealSun < 0) siderealSun += 360;

    const monthIndex = Math.floor(siderealSun / 30);
    const tamilMonth = TAMIL_MONTHS[monthIndex];

    // Tamil Day estimation based on degrees elapsed into current month sign
    const tamilDate = Math.floor(siderealSun % 30) + 1;

    // 2. Calculate Nakshatram (Moon Longitude divided by 13° 20')
    let siderealMoon = (moonEcl.elon - 24.1) % 360;
    if (siderealMoon < 0) siderealMoon += 360;

    const nakshatraIndex = Math.floor(siderealMoon / (360 / 27));
    const nakshatra = NAKSHATRAS[nakshatraIndex];

    // 3. Calculate Tithi (Difference between Moon and Sun longitudes in 12° segments)
    let angleDiff = moonEcl.elon - sunEcl.elon;
    if (angleDiff < 0) angleDiff += 360;

    const tithiIndex = Math.floor(angleDiff / 12) % 15;
    const paksha = angleDiff < 180 ? "Shukla Paksha" : "Krishna Paksha";

    let tithiName = TITHIS[tithiIndex].en;
    if (tithiIndex === 14 && paksha === "Krishna Paksha") {
        tithiName = TITHIS[tithiIndex].amavasya_en;
    }
    const fullTithiStr = `${paksha} ${tithiName}`;

    // 4. Calculate Sunrise and Sunset times
    const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, now, 1);
    const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, now, 1);

    return {
        tamilMonth: tamilMonth.en,
        tamilMonthTa: tamilMonth.ta,
        tamilDate: tamilDate,
        nakshatram: nakshatra.en,
        nakshatramTa: nakshatra.ta,
        tithi: fullTithiStr,
        sunrise: sunrise ? sunrise.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
        sunset: sunset ? sunset.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"
    };
}