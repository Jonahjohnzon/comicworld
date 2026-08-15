// src/ads/monetag.js
export function showInterstitial() {
  const fn = window.show_11581854;
  if (typeof fn !== "function") return; // SDK not loaded yet — fail silently
  fn({
    type: "inApp",
    inAppSettings: {
      frequency: 2,
      capping: 0.1,
      interval: 60,
      timeout: 5,
      everyPage: false,
    },
  }).catch(() => {}); // Monetag's promise rejects on no-fill; ignore
}