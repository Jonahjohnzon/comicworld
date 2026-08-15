// src/ads/monetag.js
export function showInterstitial() {
  const fn = window.show_11581854;
  if (typeof fn !== "function") return; // SDK not loaded yet — fail silently
  // Rewarded Interstitial — shows one ad per call, promise resolves once
  // the user has watched/closed it. No background auto-loop.
  fn()
    .then(() => {
      // Ad was watched. No reward logic needed here — we're just using
      // this as a plain "show an ad" trigger, not a reward flow.
    })
    .catch(() => {}); // no-fill or error — fail silently
}