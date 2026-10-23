import { SCREENPAL_VIDEO_URL, toScreenPalEmbedUrl } from "@/lib/video";

// 16:9 video frame on the home page. Shows the ScreenPal video when a link is
// set in src/lib/video.ts, and a friendly placeholder until then.
export function VideoSection() {
  const embedUrl = toScreenPalEmbedUrl(SCREENPAL_VIDEO_URL);

  return (
    <section aria-label="FirstReply demo video" className="w-full max-w-2xl">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-amber-400/40 bg-black/60 shadow-[0_0_40px_rgba(212,175,55,0.15)] backdrop-blur">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="FirstReply demo video"
            loading="lazy"
            allow="fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-amber-200/80">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2" />
              <path d="M23 18 L40 28 L23 38 Z" fill="currentColor" />
            </svg>
            <p className="text-sm font-medium tracking-wide">See FirstReply in action</p>
            <p className="text-xs text-amber-200/60">Demo video coming soon</p>
          </div>
        )}
      </div>
    </section>
  );
}
