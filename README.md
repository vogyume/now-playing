# Now Playing

유튜브 링크로 노래를 재생하는 레코드판 모양 음악 카드입니다.

## 곡 바꾸기

`src/tracks.ts`의 목록을 수정합니다.

```ts
export const youtubeTracks: YouTubeTrack[] = [
  { url: "https://youtu.be/영상ID", title: "보여 줄 제목" },
];
```

- `title`, `artist`를 비우면 영상 제목과 채널 이름을 자동으로 사용합니다.
- `main`에 올리면 GitHub Actions가 빌드해서 GitHub Pages에 자동 배포합니다.

## 로컬 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 배포용 빌드
```

## 참고

- 유튜브 약관에 따라 유튜브 플레이어는 카드 아래에 보이게 둡니다.
- 브라우저 정책상 첫 재생은 재생 버튼을 눌러야 시작됩니다.
