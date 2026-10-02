"""
SQLAlchemy ORM 모델. DB설계서 v1.0 6장(테이블 생성 SQL)의 DDL을 그대로 따른다.
컬럼 이름·타입·제약조건을 임의로 바꾸지 않는다. 후순위 테이블(match_invite)은 만들지 않는다.
"""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import JSON, CHAR, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

AXIS_KEYS = (
    "energy",
    "digital",
    "vivid",
    "abstract",
    "cold",
    "novel",
    "social",
    "dramatic",
)


def new_uuid() -> str:
    return str(uuid.uuid4())


class Device(Base):
    __tablename__ = "device"

    device_id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=new_uuid)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)


class ImagePool(Base):
    __tablename__ = "image_pool"

    image_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    file_name: Mapped[str] = mapped_column(unique=True)
    image_url: Mapped[str]
    kind: Mapped[str] = mapped_column(Enum("place", "mood", name="image_pool_kind"))


class Perfume(Base):
    __tablename__ = "perfume"

    perfume_id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    brand: Mapped[str]
    family: Mapped[str]
    notes: Mapped[list[str]] = mapped_column(JSON)
    image_url: Mapped[str | None] = mapped_column(default=None)


class Issue(Base):
    __tablename__ = "issue"
    __table_args__ = (
        UniqueConstraint("device_id", "issue_no", name="uq_issue_no"),
        UniqueConstraint("device_id", "track_key", name="uq_issue_tracks"),
    )

    issue_id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=new_uuid)
    device_id: Mapped[str] = mapped_column(ForeignKey("device.device_id", ondelete="CASCADE"))
    issue_no: Mapped[int]
    track_key: Mapped[str] = mapped_column(CHAR(64))
    taste_name: Mapped[str]
    summary: Mapped[str]
    tags: Mapped[list[str]] = mapped_column(JSON)

    axis_energy: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_digital: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_vivid: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_abstract: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_cold: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_novel: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_social: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_dramatic: Mapped[int] = mapped_column(TINYINT(unsigned=True))

    mood_image_id: Mapped[int | None] = mapped_column(
        ForeignKey("image_pool.image_id", ondelete="SET NULL"), default=None
    )
    ai_provider: Mapped[str]
    ai_model: Mapped[str]
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)

    tracks: Mapped[list["IssueTrack"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="IssueTrack.position"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan"
    )
    mood_image: Mapped["ImagePool | None"] = relationship()

    def axes_dict(self) -> dict[str, int]:
        return {key: getattr(self, f"axis_{key}") for key in AXIS_KEYS}


class IssueTrack(Base):
    __tablename__ = "issue_track"
    __table_args__ = (
        UniqueConstraint("issue_id", "position", name="uq_track_position"),
        UniqueConstraint("issue_id", "track_id", name="uq_track_once"),
    )

    issue_track_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    issue_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("issue.issue_id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(TINYINT)
    track_id: Mapped[int]
    title: Mapped[str]
    artist: Mapped[str]
    artwork_url: Mapped[str | None] = mapped_column(default=None)
    genre: Mapped[str | None] = mapped_column(default=None)

    issue: Mapped["Issue"] = relationship(back_populates="tracks")


class Analysis(Base):
    __tablename__ = "analysis"

    analysis_id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=new_uuid)
    device_id: Mapped[str] = mapped_column(ForeignKey("device.device_id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(
        Enum("analyzing", "fetching", "done", "failed", "canceled", name="analysis_status"),
        default="analyzing",
    )
    tracks: Mapped[list[dict]] = mapped_column(JSON)
    track_key: Mapped[str] = mapped_column(CHAR(64))
    issue_id: Mapped[str | None] = mapped_column(
        CHAR(36), ForeignKey("issue.issue_id", ondelete="SET NULL"), default=None
    )
    invite_id: Mapped[str | None] = mapped_column(CHAR(36), default=None)
    error_code: Mapped[str | None] = mapped_column(default=None)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class Recommendation(Base):
    __tablename__ = "recommendation"
    __table_args__ = (UniqueConstraint("issue_id", "category", "rank", name="uq_rec_rank"),)

    rec_id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=new_uuid)
    issue_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("issue.issue_id", ondelete="CASCADE"))
    category: Mapped[str] = mapped_column(Enum("movie", "book", "travel", "perfume", name="rec_category"))
    rank: Mapped[int] = mapped_column("rank", TINYINT)
    source: Mapped[str] = mapped_column(
        Enum("tmdb", "kakao_book", "opentripmap", "perfume_db", name="rec_source")
    )
    source_id: Mapped[str]
    title: Mapped[str]
    meta: Mapped[str]
    description: Mapped[str | None] = mapped_column(default=None)
    image_url: Mapped[str | None] = mapped_column(default=None)

    axis_energy: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_digital: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_vivid: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_abstract: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_cold: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_novel: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_social: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    axis_dramatic: Mapped[int] = mapped_column(TINYINT(unsigned=True))

    match_score: Mapped[int] = mapped_column(TINYINT(unsigned=True))
    reason: Mapped[str]
    mappings: Mapped[list[dict]] = mapped_column(JSON)
    evidence: Mapped[str]
    tags: Mapped[list[str]] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)

    issue: Mapped["Issue"] = relationship(back_populates="recommendations")
    stamp: Mapped["Stamp | None"] = relationship(back_populates="recommendation", cascade="all, delete-orphan")

    def axes_dict(self) -> dict[str, int]:
        return {key: getattr(self, f"axis_{key}") for key in AXIS_KEYS}


class Stamp(Base):
    __tablename__ = "stamp"

    rec_id: Mapped[str] = mapped_column(
        CHAR(36), ForeignKey("recommendation.rec_id", ondelete="CASCADE"), primary_key=True
    )
    stamp: Mapped[str] = mapped_column(Enum("love", "near", "unsure", "no", name="stamp_value"))
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    recommendation: Mapped["Recommendation"] = relationship(back_populates="stamp")
