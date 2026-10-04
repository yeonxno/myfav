/**
 * iTunes 검색은 백엔드를 통해 호출한다.
 * Apps in Toss iOS WebView에서 Apple 도메인 직접 요청이 실패하는 문제를 피한다.
 */
import { apiRequest } from "./client";

export interface MusicSearchTrack {
  track_id: number;
  title: string;
  artist: string;
  artwork_url: string | null;
  genre: string | null;
}

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

  const params = new URLSearchParams({ q: trimmed });
  const tracks = await apiRequest<MusicSearchTrack[]>(`/music/search?${params.toString()}`);

  searchCache.set(trimmed, tracks);
  return tracks;
}
