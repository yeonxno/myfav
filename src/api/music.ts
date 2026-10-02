/**
 * iTunes Search API 직접 호출. API명세서 5.1절 기준.
 * 이 함수 하나로 분리해 두어, 토스 환경에서 직접 호출이 막히면
 * 이 파일의 구현만 서버 경유(`GET /music/search?q=`)로 바꾸면 된다.
 *
 * 확인 필요(2026-10-02, 사용자 승인): API명세서 5.1절은 country=KR을 고정값으로 요구하지만,
 * 실제 호출해보니 country=KR일 때는 어떤 검색어로도 결과가 0건이다(JP/GB/FR/DE는 정상).
 * 사용자 브라우저에서도 동일하게 재현되어 일시적 네트워크 문제가 아님을 확인했다.
 * 개발을 막지 않기 위해 country 파라미터를 뺀 글로벌 카탈로그 검색으로 임시 전환한다.
 * Apple 쪽 KR 스토어 문제가 해소되면 country=KR을 다시 추가해야 한다.
 */
export interface MusicSearchTrack {
  track_id: number;
  title: string;
  artist: string;
  artwork_url: string | null;
  genre: string | null;
}

interface ItunesSearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
}

interface ItunesSearchResponse {
  results: ItunesSearchResult[];
}

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const SEARCH_LIMIT = 10;

const searchCache = new Map<string, MusicSearchTrack[]>();

export async function searchMusic(term: string): Promise<MusicSearchTrack[]> {
  const trimmed = term.trim();
  if (!trimmed) {
    return [];
  }

  const cached = searchCache.get(trimmed);
  if (cached) {
    return cached;
  }

  const url = new URL(ITUNES_SEARCH_URL);
  url.searchParams.set("term", trimmed);
  // country=KR 임시 비활성화 사유는 위 파일 docblock 참고.
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(SEARCH_LIMIT));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("iTunes 검색에 실패했어요.");
  }
  const json = (await response.json()) as ItunesSearchResponse;

  const tracks: MusicSearchTrack[] = json.results.map((item) => ({
    track_id: item.trackId,
    title: item.trackName,
    artist: item.artistName,
    artwork_url: item.artworkUrl100 ?? null,
    genre: item.primaryGenreName ?? null,
  }));

  searchCache.set(trimmed, tracks);
  return tracks;
}
