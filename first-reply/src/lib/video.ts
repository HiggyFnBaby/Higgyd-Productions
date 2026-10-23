// The ScreenPal demo video shown on the home page.
//
// <<< ScreenPal - Video link will go here >>>
//
// Paste the ScreenPal link between the quotes below. Either kind works:
//   https://go.screenpal.com/watch/XXXXXXXX   (the normal share link)
//   https://go.screenpal.com/player/XXXXXXXX  (the embed link)
// Leave it empty ("") and the page shows a "video coming soon" card instead.
export const SCREENPAL_VIDEO_URL = "";

// Turns a ScreenPal share link into the embeddable player address.
// Returns null for anything that isn't a ScreenPal link, so a typo or a
// link from another site can never end up inside the page.
export function toScreenPalEmbedUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isScreenPal = host === "screenpal.com" || host.endsWith(".screenpal.com");
    if (url.protocol !== "https:" || !isScreenPal) return null;
    const match = url.pathname.match(/^\/(?:watch|player)\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    return `https://go.screenpal.com/player/${match[1]}?width=100%&height=100%&ff=1&title=0`;
  } catch {
    return null;
  }
}
