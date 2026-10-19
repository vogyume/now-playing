import type { NowPlayingTrack } from "@/components/kokonutui/now-playing";

export interface YouTubeTrack {
  /** 유튜브 링크 (watch · youtu.be · shorts · music 모두 가능) */
  url: string;
  /** 직접 지정할 제목. 비우면 영상 제목을 자동으로 사용 */
  title?: string;
  /** 직접 지정할 아티스트. 비우면 채널 이름을 자동으로 사용 */
  artist?: string;
}

// 유튜브 곡 목록: 여기에 넣은 순서대로 재생합니다. 길이는 영상에서 자동으로 가져옵니다.
// 예) { url: "https://youtu.be/xxxxxxxxxxx", title: "보여 줄 제목" }
export const youtubeTracks: YouTubeTrack[] = [
  { url: "https://youtu.be/5u4xTa3LR2U?si=N0fJ_xtT--ucePOB", title: "민상아 생일축하해" },
];

// 유튜브 곡이 없을 때 보여 주는 데모 곡 (소리 없이 화면만 재생)
export const demoTracks: NowPlayingTrack[] = [
  { title: "Low Tide", artist: "Pale Harbor", duration: 192, artwork: 0 },
  { title: "Static Bloom", artist: "Juniper Wire", duration: 167, artwork: 1 },
  { title: "Night Signal", artist: "The Quiet Hours", duration: 245, artwork: 2 },
];
