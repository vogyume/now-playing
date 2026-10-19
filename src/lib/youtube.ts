import React from "react";
import type { NowPlayingMedia, NowPlayingMediaEvent } from "@/components/kokonutui/now-playing";

/* -------------------------------------------------------------------------- */
/*  YouTube IFrame Player API 연결                                            */
/*  공식 플레이어를 화면에 보이게 두고(약관: 숨기기·가리기 금지, 200x200 이상), */
/*  Now Playing 카드의 재생·일시정지·이동·곡 넘김을 이 플레이어에 연결한다.    */
/* -------------------------------------------------------------------------- */

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): { title?: string; author?: string };
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      width: string;
      height: string;
      videoId: string;
      playerVars: Record<string, number>;
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
        onError: (event: { data: number }) => void;
      };
    }
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// YT.PlayerState
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const CUED = 5;

/** 유튜브 링크(watch·youtu.be·shorts·embed·music) 또는 영상 ID에서 11자리 ID를 꺼낸다. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.hostname.endsWith("youtu.be")) {
      return url.pathname.slice(1, 12) || null;
    }
    const v = url.searchParams.get("v");
    if (v) {
      return v;
    }
    const match = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT) {
          resolve(window.YT);
        }
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

export interface YouTubeMeta {
  title?: string;
  author?: string;
  duration?: number;
}

/**
 * 영상 ID 목록으로 유튜브 플레이어를 만들고 카드용 media 컨트롤러를 돌려준다.
 * mountRef를 붙인 요소 자리에 플레이어(iframe)가 들어간다.
 */
export function useYouTubeMedia(
  videoIds: string[],
  onMeta: (index: number, meta: YouTubeMeta) => void
) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<YTPlayer | null>(null);
  const readyRef = React.useRef(false);
  const indexRef = React.useRef(0);
  const listenersRef = React.useRef(new Set<(event: NowPlayingMediaEvent) => void>());
  const idsRef = React.useRef(videoIds);
  idsRef.current = videoIds;
  const onMetaRef = React.useRef(onMeta);
  onMetaRef.current = onMeta;

  const emit = React.useCallback((event: NowPlayingMediaEvent) => {
    for (const listener of listenersRef.current) {
      listener(event);
    }
  }, []);

  const reportMeta = React.useCallback(() => {
    const player = playerRef.current;
    if (!(player && readyRef.current)) {
      return;
    }
    const data = player.getVideoData();
    const duration = player.getDuration();
    onMetaRef.current(indexRef.current, {
      title: data.title || undefined,
      author: data.author || undefined,
      duration: duration > 0 ? Math.round(duration) : undefined,
    });
  }, []);

  const firstId = videoIds[0];
  React.useEffect(() => {
    if (!(firstId && mountRef.current)) {
      return;
    }
    let cancelled = false;
    const host = document.createElement("div");
    mountRef.current.appendChild(host);

    loadYouTubeApi().then((YT) => {
      if (cancelled) {
        return;
      }
      playerRef.current = new YT.Player(host, {
        width: "100%",
        height: "100%",
        videoId: firstId,
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            readyRef.current = true;
            reportMeta();
          },
          onStateChange: ({ data }) => {
            if (data === PLAYING) {
              reportMeta();
              emit("playing");
            } else if (data === PAUSED) {
              emit("paused");
            } else if (data === ENDED) {
              emit("ended");
            } else if (data === CUED) {
              reportMeta();
            }
          },
          // 2: 잘못된 ID, 5: HTML5 오류, 100: 없는 영상, 101·150: 퍼가기 금지
          onError: () => emit("error"),
        },
      });
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
      host.remove();
    };
  }, [firstId, emit, reportMeta]);

  const media = React.useMemo<NowPlayingMedia>(
    () => ({
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      seek: (seconds) => playerRef.current?.seekTo(seconds, true),
      load: (index, autoplay) => {
        indexRef.current = index;
        const id = idsRef.current[index];
        const player = playerRef.current;
        if (!(id && player && readyRef.current)) {
          return;
        }
        if (autoplay) {
          player.loadVideoById(id);
        } else {
          player.cueVideoById(id);
        }
      },
      time: () => (readyRef.current ? (playerRef.current?.getCurrentTime() ?? null) : null),
      duration: () => {
        const d = readyRef.current ? (playerRef.current?.getDuration() ?? 0) : 0;
        return d > 0 ? d : null;
      },
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => listenersRef.current.delete(listener);
      },
    }),
    []
  );

  return { media, mountRef };
}

/** 재생 전에도 제목·채널 이름을 보여 주기 위해 유튜브 oEmbed로 정보를 가져온다. */
export async function fetchYouTubeInfo(videoId: string): Promise<YouTubeMeta> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
  const response = await fetch(url);
  if (!response.ok) {
    return {};
  }
  const data = (await response.json()) as { title?: string; author_name?: string };
  return { title: data.title, author: data.author_name };
}
