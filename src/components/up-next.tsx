import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import type { NowPlayingTrack } from "@/components/kokonutui/now-playing";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Up next: 지금 곡 다음 순서의 곡들을 작은 썸네일 캐러셀로 보여 준다.        */
/*  썸네일을 누르면 그 곡을 바로 재생한다.                                     */
/* -------------------------------------------------------------------------- */

interface UpNextProps {
  tracks: NowPlayingTrack[];
  /** 지금 재생 중인 곡 번호 */
  current: number;
  onSelect: (index: number) => void;
  className?: string;
}

const ARROW_BUTTON =
  "inline-flex size-7 items-center justify-center rounded-full text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

export function UpNext({ tracks, current, onSelect, className }: UpNextProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ start: true, end: true });

  // 지금 곡 다음부터 한 바퀴 (지금 곡은 제외)
  const queue = React.useMemo(
    () =>
      Array.from({ length: Math.max(tracks.length - 1, 0) }, (_, k) => {
        const index = (current + 1 + k) % tracks.length;
        return { index, track: tracks[index] };
      }),
    [tracks, current]
  );

  // 좌우 화살표: 넘길 곳이 없으면 비활성화
  const updateEdges = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    // 곡이 바뀌면 처음(바로 다음 곡)으로 되돌림
    el.scrollTo({ left: 0 });
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [queue, updateEdges]);

  const scrollByItems = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    const item = el?.firstElementChild as HTMLElement | null;
    if (!(el && item)) {
      return;
    }
    el.scrollBy({ left: direction * (item.offsetWidth + 12) * 2, behavior: "smooth" });
  };

  if (queue.length === 0) {
    return null;
  }

  return (
    <section aria-label="다음 곡" className={cn("w-full max-w-sm md:w-72", className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium text-[11px] text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          Up next
        </span>
        <div className="flex items-center gap-1">
          <button aria-label="이전 목록" className={ARROW_BUTTON} disabled={edges.start} onClick={() => scrollByItems(-1)} type="button">
            <ChevronLeft className="size-4" />
          </button>
          <button aria-label="다음 목록" className={ARROW_BUTTON} disabled={edges.end} onClick={() => scrollByItems(1)} type="button">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={updateEdges}
        ref={scrollerRef}
      >
        {queue.map(({ index, track }, k) => (
          <button
            aria-label={`${track.title} 재생`}
            className="group w-24 shrink-0 snap-start text-left focus-visible:outline-none"
            key={index}
            onClick={() => onSelect(index)}
            type="button"
          >
            <span className="relative block size-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 ring-zinc-400 ring-offset-2 ring-offset-white transition-transform duration-150 group-hover:-translate-y-0.5 group-focus-visible:ring-2 dark:border-zinc-800 dark:bg-zinc-800 dark:ring-offset-zinc-950">
              {track.cover ? (
                <img alt="" className="size-full object-cover" loading="lazy" src={track.cover} />
              ) : null}
              {k === 0 ? (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-zinc-900/80 px-1.5 py-0.5 font-medium text-[10px] text-white">
                  다음
                </span>
              ) : null}
            </span>
            <span className="mt-2 block truncate font-medium text-xs text-zinc-900 dark:text-zinc-50">{track.title}</span>
            <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">{track.artist}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
