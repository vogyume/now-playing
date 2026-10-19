import type { NowPlayingTrack } from "@/components/kokonutui/now-playing";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Playlist: 카드 옆에 붙는 재생 목록 패널.                                    */
/*  전체 곡을 순서대로 보여 주고, 지금 곡을 강조하며, 누르면 그 곡을 재생한다. */
/* -------------------------------------------------------------------------- */

interface PlaylistProps {
  tracks: NowPlayingTrack[];
  /** 지금 재생 중인 곡 번호 */
  current: number;
  onSelect: (index: number) => void;
  /** 강조 색 (카드와 같은 값) */
  accent?: string;
  className?: string;
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function Playlist({ tracks, current, onSelect, accent = "#f97316", className }: PlaylistProps) {
  return (
    <section
      aria-label="재생 목록"
      className={cn(
        "flex w-full max-w-sm flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
      style={{ "--playlist-accent": accent } as React.CSSProperties}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="font-medium text-[11px] text-zinc-500 uppercase tracking-wider dark:text-zinc-400">Playlist</span>
        <span className="text-[11px] text-zinc-400 tabular-nums dark:text-zinc-500">{tracks.length}곡</span>
      </div>
      <ol className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {tracks.map((track, index) => {
          const active = index === current;
          return (
            <li key={`${index}-${track.title}`}>
              <button
                aria-current={active ? "true" : undefined}
                aria-label={`${track.title} 재생`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                  active ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                )}
                onClick={() => onSelect(index)}
                type="button"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {track.cover ? <img alt="" className="size-full object-cover" loading="lazy" src={track.cover} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate font-medium text-sm",
                      active ? "text-(--playlist-accent)" : "text-zinc-900 dark:text-zinc-50"
                    )}
                  >
                    {track.title}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{track.artist}</span>
                </span>
                <span className="shrink-0 text-xs text-zinc-400 tabular-nums dark:text-zinc-500">
                  {active ? (
                    <span className="font-medium text-(--playlist-accent)">재생 중</span>
                  ) : track.duration > 0 ? (
                    formatTime(track.duration)
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
