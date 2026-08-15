/**
 * Fetches dynamic event data from GitHub Pages JSON repository.
 */

import { GITHUB_JSON_URL } from './config.js';

export async function fetchGitHubEvents() {
  const container = document.getElementById("events-container");
  if (!container) return;

  try {
    if (!GITHUB_JSON_URL || GITHUB_JSON_URL.includes("YOUR_USERNAME")) {
      console.log("GitHub URL not configured. Skipping remote events fetch.");
      return;
    }

    // Append timestamp query parameter to bypass cache
    const cacheBusterUrl = `${GITHUB_JSON_URL}?_=${new Date().getTime()}`;
    const response = await fetch(cacheBusterUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const todayKey = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    container.innerHTML = ""; // Clear existing output

    let hasContent = false;

    // Display Special Event if available for today
    if (data.events && data.events[todayKey]) {
      const ev = data.events[todayKey];
      container.innerHTML += `
        <div class="event-item">
          <div class="event-title">✨ ${ev.title}</div>
          <div class="event-desc">${ev.description}</div>
        </div>
      `;
      hasContent = true;
    }

    // Display Daily Pasuram / Quote if present
    if (data.daily_pasuram) {
      container.innerHTML += `
        <div class="event-item" style="border-left-color: var(--accent, #d97706);">
          <div class="event-title">📜 Daily Pasuram / Quote</div>
          <div class="event-desc"><em>"${data.daily_pasuram}"</em></div>
        </div>
      `;
      hasContent = true;
    }

    if (!hasContent) {
      container.innerHTML = `
        <div class="event-item">
          <div class="event-title">No Special Events Today</div>
          <div class="event-desc">Regular daily rituals and observational panchangam apply.</div>
        </div>
      `;
    }

  } catch (error) {
    console.warn("Could not load dynamic GitHub data. Using offline mode:", error);
    container.innerHTML = `
      <div class="event-item" style="border-left-color: #64748b;">
        <div class="event-title">Standard Calendar Mode</div>
        <div class="event-desc">Configure your repo JSON URL in config.js to show live temple updates.</div>
      </div>
    `;
  }
}