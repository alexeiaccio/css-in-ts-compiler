// The type hovers of the code blocks (twoslash's CSS-only popups) sit inside a <pre> that scrolls, which clips them. This puts the
// popup of the token under the pointer at fixed coordinates, beside the token, inside the window.
export function placeHovers() {
  document.addEventListener("pointerover", (e) => {
    const token = (e.target as Element).closest(".twoslash-hover, .twoslash-error-hover");
    const popup = token?.querySelector<HTMLElement>(".twoslash-popup-container");
    if (!token || !popup) return;
    const at = token.getBoundingClientRect();
    popup.style.position = "fixed";
    popup.style.top = `${at.bottom + 6}px`;
    popup.style.left = `${Math.max(8, Math.min(at.left, innerWidth - popup.offsetWidth - 8))}px`;
  });
}
