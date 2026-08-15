/**
 * Fetches dynamic event data from GitHub Pages JSON repository.
 */

import { GITHUB_JSON_URL } from './config.js';

  export async function fetchGitHubEvents() {
    const container = document.getElementById("events-container");
    try {
        // Append timestamp query parameter to bypass cache
        // If URL contains default placeholder, skip fetching silently
        if (!GITHUB_JSON_URL || GITHUB_JSON_URL.includes("YOUR_USERNAME")) {
            console.log("GitHub URL not configured. Skipping remote events fetch.");
            return;
        }

        try {
            const response = await fetch(GITHUB_JSON_URL);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            displayGitHubEvents(data);
        } catch (error) {
            // Log a mild warning instead of failing
            console.warn("Could not load dynamic GitHub data. Using offline mode.");
        }

        const data = await response.json();
        const todayKey = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

        container.innerHTML = ""; // Clear existing output

        // Display Special Event if available for today
        if (data.events && data.events[todayKey]) {
            const ev = data.events[todayKey];
            container.innerHTML += `
        <div class="event-item">
          <div class="event-title">✨ ${ev.title}</div>
          <div class="event-desc">${ev.description}</div>
        </div>
      `;
        }

        // Display Daily Pasuram / Quote if present
        if (data.daily_pasuram) {
            container.innerHTML += `
        <div class="event-item" style="border-left-color: var(--accent);">
          <div class="event-title">📜 Daily Pasuram / Quote</div>
          <div class="event-desc"><em>"${data.daily_pasuram}"</em></div>
        </div>
      `;
        }

    } catch (error) {
        console.warn("Could not load dynamic GitHub data:", error);
        container.innerHTML = `
      <div class="event-item" style="border-left-color: #64748b;">
        <div class="event-title">Standard Calendar Mode</div>
        <div class="event-desc">Configure your repo JSON URL in config.js to show live temple updates.</div>
      </div>
    `;
    }
}