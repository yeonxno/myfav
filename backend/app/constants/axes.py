"""8개 감각 축. 기능명세서 3.4절 / API명세서 1.4절 기준(frontend src/constants/axes.ts와 동일 정의)."""

from dataclasses import dataclass


@dataclass(frozen=True)
class AxisDefinition:
    key: str
    left: str
    right: str


AXIS_DEFINITIONS: tuple[AxisDefinition, ...] = (
    AxisDefinition("energy", "고요한", "에너지 있는"),
    AxisDefinition("digital", "아날로그", "디지털"),
    AxisDefinition("vivid", "몽환적인", "선명한"),
    AxisDefinition("abstract", "서정적인", "추상적인"),
    AxisDefinition("cold", "따뜻한", "차가운"),
    AxisDefinition("novel", "익숙한", "새로운"),
    AxisDefinition("social", "혼자만의", "함께하는"),
    AxisDefinition("dramatic", "잔잔한", "극적인"),
)

AXIS_KEYS: tuple[str, ...] = tuple(a.key for a in AXIS_DEFINITIONS)
