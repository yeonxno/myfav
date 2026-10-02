"""DB설계서 3.3절: track_key = iTunes 곡 ID를 오름차순 정렬해 쉼표로 이은 문자열의 SHA-256."""

import hashlib


def compute_track_key(track_ids: list[int]) -> str:
    sorted_ids = sorted(track_ids)
    joined = ",".join(str(i) for i in sorted_ids)
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()
