// Thin wrapper around window.Telegram.WebApp so the rest of the app
// doesn't need to worry about it being undefined (e.g. during local dev in a browser tab).

const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  // Match Telegram's active theme (dark/light) — we default to dark regardless,
  // but this keeps the native chrome (header, background) in sync.
  document.documentElement.style.setProperty(
    "--tg-bg",
    tg.themeParams?.bg_color ? `#${tg.themeParams.bg_color}` : "#0B0B0F"
  );
}

export function getInitData() {
  return tg?.initData || "";
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user || null;
}

export function hapticImpact(style = "light") {
  tg?.HapticFeedback?.impactOccurred(style);
}

export function showBackButton(onClick) {
  if (!tg) return () => {};
  tg.BackButton.show();
  tg.BackButton.onClick(onClick);
  return () => {
    tg.BackButton.offClick(onClick);
    tg.BackButton.hide();
  };
}

export function hideBackButton() {
  tg?.BackButton?.hide();
}

export const isInsideTelegram = Boolean(tg);
