"""
취향 연결(%) 계산. 기능명세서 3.5절: "사용자의 8개 축 점수와 추천 대상의 8개 축 점수 차이를
서버에서 계산해 60~99%로 환산". 정확한 산식은 명세서에 없어 아래와 같이 새로 정했다
(차이가 작을수록 100에 가깝고, 0~99% 유사도를 60~99 범위로 선형 변환).
"""

from app.constants.axes import AXIS_KEYS
from app.constants.values import MATCH_SCORE_MAX, MATCH_SCORE_MIN


def compute_match_score(user_axes: dict[str, int], target_axes: dict[str, int]) -> int:
    max_diff_per_axis = 100
    total_diff = sum(abs(user_axes[key] - target_axes[key]) for key in AXIS_KEYS)
    max_total_diff = max_diff_per_axis * len(AXIS_KEYS)

    similarity = 1 - (total_diff / max_total_diff)  # 0.0 ~ 1.0
    similarity = max(0.0, min(1.0, similarity))

    score = MATCH_SCORE_MIN + round(similarity * (MATCH_SCORE_MAX - MATCH_SCORE_MIN))
    return max(MATCH_SCORE_MIN, min(MATCH_SCORE_MAX, score))
