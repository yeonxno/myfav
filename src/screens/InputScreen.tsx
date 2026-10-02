/**
 * SCR-INPUT · 음악 입력 (+ SCR-INPUT-SEARCH 검색 상태)
 * 와이어프레임:
 *   docs/취향번역기_와이어프레임/02 MUSIC INPUT — TRACKLIST.png
 *   docs/취향번역기_와이어프레임/02-1 MUSIC INPUT — SEARCH.png
 */
import { useEffect, useRef, useState } from "react";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { MainButton } from "../components/MainButton";
import { NoticeBox } from "../components/NoticeBox";
import { useToast } from "../components/Toast";
import { useNavigation, useScreenParams } from "../navigation/ScreenStack";
import { ScreenId } from "../navigation/types";
import { searchMusic, type MusicSearchTrack } from "../api/music";
import { createAnalysis } from "../api/analyses";
import { TRACK_COUNT_MAX, TRACK_COUNT_MIN, MUSIC_SEARCH_DEBOUNCE_MS, TOAST_MESSAGES } from "../constants/config";
import "./InputScreen.css";

export function InputScreen() {
  const params = useScreenParams<typeof ScreenId.Input>();
  const { push, resetToSequence, registerBackOverride, updateTopParams } = useNavigation();
  const { showToast } = useToast();

  // 기능명세서 2.3절: 분석/재시도 화면을 거쳐 돌아와도 선택이 유지되어야 하므로,
  // 화면이 스택에서 내려갈 때도 선택 목록을 네비게이션 파라미터에 보존해 둔다.
  const [tracks, setTracks] = useState<MusicSearchTrack[]>(params?.tracks ?? []);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicSearchTrack[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    updateTopParams<typeof ScreenId.Input>({ tracks });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  useEffect(
    () =>
      registerBackOverride(() => {
        if (isSearching) {
          setIsSearching(false);
          inputRef.current?.blur();
          return true;
        }
        return false;
      }),
    [isSearching, registerBackOverride],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchMusic(trimmed);
        setResults(found);
      } catch {
        showToast(TOAST_MESSAGES.networkRetry);
      } finally {
        setSearchLoading(false);
      }
    }, MUSIC_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function addTrack(track: MusicSearchTrack) {
    if (tracks.some((t) => t.track_id === track.track_id)) {
      return;
    }
    if (tracks.length >= TRACK_COUNT_MAX) {
      showToast(TOAST_MESSAGES.trackLimitExceeded);
      return;
    }
    setTracks((prev) => [...prev, track]);
    showToast(TOAST_MESSAGES.trackAdded);
  }

  function removeTrack(trackId: number) {
    setTracks((prev) => prev.filter((t) => t.track_id !== trackId));
    showToast(TOAST_MESSAGES.trackRemoved);
  }

  async function handleSubmit() {
    if (tracks.length < TRACK_COUNT_MIN || submitting) return;
    setSubmitting(true);
    try {
      const trackInputs = tracks.map((t) => ({
        track_id: t.track_id,
        title: t.title,
        artist: t.artist,
        artwork_url: t.artwork_url ?? undefined,
        genre: t.genre ?? undefined,
      }));
      const response = await createAnalysis({
        tracks: trackInputs,
        invite_id: params?.invite_id ?? null,
      });
      if (response.status === "done" && response.issue_id) {
        // 같은 곡 조합 재사용: 분석 화면을 거치지 않으므로 뒤로가기 목적지도 재방문 홈으로 맞춘다.
        resetToSequence([
          { screen: ScreenId.HomeReturn, params: undefined },
          { screen: ScreenId.Profile, params: { issue_id: response.issue_id } },
        ]);
        return;
      }
      push(ScreenId.Analysis, {
        analysis_id: response.analysis_id,
        tracks: trackInputs,
        invite_id: params?.invite_id ?? null,
      });
    } catch {
      showToast(TOAST_MESSAGES.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = tracks.length >= TRACK_COUNT_MIN;

  return (
    <ScreenContainer
      footer={
        <>
          <MainButton disabled={!canSubmit || submitting} onClick={handleSubmit}>
            이 음악들로 번역하기
          </MainButton>
          <p className="input-footer-caption">
            {isSearching
              ? `${tracks.length}곡 선택 · 같은 곡은 한 번만 담을 수 있어요`
              : canSubmit
                ? `${tracks.length}곡 선택 완료 · 조금 더 추가해도 좋아요`
                : null}
          </p>
        </>
      }
    >
      <ScreenHeader
        eyebrow="TASTE SOURCE : MUSIC"
        headline="당신의 취향을 들려주세요."
        subtext={
          <>
            요즘 가장 자주 듣는 음악 3–5곡.
            <br />
            유명한 곡보다, 당신다운 곡이면 좋아요.
          </>
        }
      />

      <div className="input-search-box">
        <span className="input-search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="곡 또는 아티스트를 검색하세요"
          onFocus={() => setIsSearching(true)}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isSearching ? (
        <SearchResults
          loading={searchLoading}
          results={results}
          selectedIds={new Set(tracks.map((t) => t.track_id))}
          onAdd={addTrack}
        />
      ) : null}

      <div className="input-tracks-head">
        <p className="input-tracks-title">MY TRACKS</p>
        <p className="input-tracks-count">
          {tracks.length} / {TRACK_COUNT_MAX}
        </p>
      </div>

      <div className="input-track-list">
        {tracks.map((track) => (
          <div className="input-track-card" key={track.track_id}>
            <span className="input-track-art">
              {track.artwork_url ? <img src={track.artwork_url} alt="" /> : null}
            </span>
            <span className="input-track-info">
              <span className="input-track-title">{track.title}</span>
              <span className="input-track-artist">{track.artist}</span>
            </span>
            <button
              type="button"
              className="input-track-remove"
              aria-label={`${track.title} 삭제`}
              onClick={() => removeTrack(track.track_id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {isSearching && tracks.length < TRACK_COUNT_MIN ? (
        <div className="input-warning-box">
          <span aria-hidden="true">!</span>
          <span>
            {TRACK_COUNT_MIN - tracks.length}곡만 더 고르면 번역할 수 있어요. (최소 {TRACK_COUNT_MIN}곡)
          </span>
        </div>
      ) : null}

      {!isSearching ? (
        <NoticeBox icon="♪">반복해서 듣는 노래에 취향의 힌트가 있어요.</NoticeBox>
      ) : null}
    </ScreenContainer>
  );
}

function SearchResults({
  loading,
  results,
  selectedIds,
  onAdd,
}: {
  loading: boolean;
  results: MusicSearchTrack[] | null;
  selectedIds: Set<number>;
  onAdd: (track: MusicSearchTrack) => void;
}) {
  if (loading) {
    return <div className="input-search-results-empty">검색하는 중…</div>;
  }
  if (results === null) {
    return null;
  }
  if (results.length === 0) {
    return (
      <div className="input-search-results-empty">
        찾는 곡이 없어요. 아티스트 이름으로도 검색해 보세요.
      </div>
    );
  }
  return (
    <div className="input-search-results">
      {results.map((track) => {
        const selected = selectedIds.has(track.track_id);
        return (
          <div className="input-search-row" key={track.track_id}>
            <span className="input-track-art">
              {track.artwork_url ? <img src={track.artwork_url} alt="" /> : null}
            </span>
            <span className="input-track-info">
              <span className="input-track-title">{track.title}</span>
              <span className="input-track-artist">{track.artist}</span>
            </span>
            {selected ? (
              <span className="input-search-added-pill">담은 곡</span>
            ) : (
              <button type="button" className="input-search-add-button" onClick={() => onAdd(track)}>
                + 담기
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
