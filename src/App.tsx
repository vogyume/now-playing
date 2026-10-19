import React from "react";
import NowPlaying, { type NowPlayingControl, type NowPlayingTrack } from "@/components/kokonutui/now-playing";
import { Playlist } from "@/components/playlist";
import { fetchYouTubeInfo, parseYouTubeId, useYouTubeMedia, type YouTubeMeta } from "@/lib/youtube";
import { demoTracks, type YouTubeTrack, youtubeTracks } from "@/tracks";

// 링크가 올바른 곡만 사용 (영상 ID + 직접 지정한 제목·아티스트)
const entries = youtubeTracks
  .map((track) => ({ ...track, id: parseYouTubeId(track.url) }))
  .filter((track): track is YouTubeTrack & { id: string } => Boolean(track.id));

export default function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      {entries.length > 0 ? <YouTubeNowPlaying entries={entries} /> : <NowPlaying tracks={demoTracks} />}
    </main>
  );
}

function YouTubeNowPlaying({ entries }: { entries: (YouTubeTrack & { id: string })[] }) {
  const ids = React.useMemo(() => entries.map((entry) => entry.id), [entries]);
  const [tracks, setTracks] = React.useState<NowPlayingTrack[]>(() =>
    entries.map((entry, i) => ({
      title: entry.title ?? "불러오는 중…",
      artist: entry.artist ?? "YouTube",
      duration: 0,
      artwork: i % 3,
      // 앨범 표지: 직접 지정한 이미지, 없으면 유튜브 썸네일(16:9, 검은 띠 없음)
      cover: entry.cover ?? `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`,
    }))
  );
  // 영상에서 가져온 정보로 채우되, 직접 지정한 제목·아티스트가 있으면 그것을 유지
  const onMeta = React.useCallback(
    (index: number, meta: YouTubeMeta) => {
      const custom = entries[index];
      setTracks((prev) =>
        prev.map((track, i) =>
          i === index
            ? {
                ...track,
                title: custom?.title ?? meta.title ?? track.title,
                artist: custom?.artist ?? meta.author ?? track.artist,
                duration: meta.duration ?? track.duration,
              }
            : track
        )
      );
    },
    [entries]
  );
  const { media, mountRef } = useYouTubeMedia(ids, onMeta);
  const controlRef = React.useRef<NowPlayingControl>(null);
  const [current, setCurrent] = React.useState(0);

  // 재생 전에도 모든 곡의 제목·채널을 표시
  React.useEffect(() => {
    ids.forEach((id, index) => {
      fetchYouTubeInfo(id)
        .then((meta) => onMeta(index, meta))
        .catch(() => undefined);
    });
  }, [ids, onMeta]);

  // 넓은 화면: 왼쪽 [지금 곡 카드 / 유튜브 플레이어], 오른쪽에 두 칸 높이를 채우는 재생 목록
  // 좁은 화면: 카드 → 재생 목록 → 플레이어 순서로 세로 배치
  return (
    <div className="grid w-full max-w-sm grid-cols-1 gap-6 md:w-auto md:max-w-none md:grid-cols-[24rem_22rem]">
      {/* 첫 재생은 브라우저 정책상 클릭이 필요하므로 자동 재생은 끔 */}
      <NowPlaying
        autoPlay={false}
        className="md:col-start-1 md:row-start-1"
        controlRef={controlRef}
        media={media}
        onTrackChange={setCurrent}
        tracks={tracks}
      />
      <Playlist
        className="md:col-start-2 md:row-span-2 md:row-start-1 md:max-w-none"
        current={current}
        onSelect={(index) => controlRef.current?.playTrack(index)}
        tracks={tracks}
      />
      {/* 유튜브 약관상 플레이어는 보이게 둔다 (200x200 이상) */}
      <div
        className="aspect-video w-full max-w-sm overflow-hidden rounded-3xl border border-zinc-200 bg-black md:col-start-1 md:row-start-2 dark:border-zinc-800 [&_iframe]:block [&_iframe]:size-full"
        ref={mountRef}
      />
    </div>
  );
}
