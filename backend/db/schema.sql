-- MVP 테이블 8개. docs/취향번역기_DB설계서.md 6장의 DDL을 그대로 옮겼다.
-- 임의로 컬럼/제약을 바꾸지 않는다. 문서가 바뀌면 이 파일도 함께 갱신한다.
-- MySQL 8 기준. 참조 순서대로 실행한다.

CREATE TABLE device (
  device_id  CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE image_pool (
  image_id  BIGINT NOT NULL AUTO_INCREMENT,
  file_name VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  kind      ENUM('place','mood') NOT NULL,
  PRIMARY KEY (image_id),
  UNIQUE KEY uq_image_file_name (file_name)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE perfume (
  perfume_id VARCHAR(20) NOT NULL,
  name       VARCHAR(100) NOT NULL,
  brand      VARCHAR(100) NOT NULL,
  family     VARCHAR(40) NOT NULL,
  notes      JSON NOT NULL,
  image_url  VARCHAR(500) NULL,
  PRIMARY KEY (perfume_id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE issue (
  issue_id      CHAR(36) NOT NULL,
  device_id     CHAR(36) NOT NULL,
  issue_no      INT NOT NULL,
  track_key     CHAR(64) NOT NULL,
  taste_name    VARCHAR(60) NOT NULL,
  summary       VARCHAR(300) NOT NULL,
  tags          JSON NOT NULL,
  axis_energy   TINYINT UNSIGNED NOT NULL,
  axis_digital  TINYINT UNSIGNED NOT NULL,
  axis_vivid    TINYINT UNSIGNED NOT NULL,
  axis_abstract TINYINT UNSIGNED NOT NULL,
  axis_cold     TINYINT UNSIGNED NOT NULL,
  axis_novel    TINYINT UNSIGNED NOT NULL,
  axis_social   TINYINT UNSIGNED NOT NULL,
  axis_dramatic TINYINT UNSIGNED NOT NULL,
  mood_image_id BIGINT NULL,
  ai_provider   VARCHAR(20) NOT NULL,
  ai_model      VARCHAR(40) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (issue_id),
  UNIQUE KEY uq_issue_no (device_id, issue_no),
  UNIQUE KEY uq_issue_tracks (device_id, track_key),
  KEY idx_issue_device_created (device_id, created_at),
  CONSTRAINT fk_issue_device FOREIGN KEY (device_id)
    REFERENCES device (device_id) ON DELETE CASCADE,
  CONSTRAINT fk_issue_image FOREIGN KEY (mood_image_id)
    REFERENCES image_pool (image_id) ON DELETE SET NULL
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE issue_track (
  issue_track_id BIGINT NOT NULL AUTO_INCREMENT,
  issue_id       CHAR(36) NOT NULL,
  position       TINYINT NOT NULL,
  track_id       BIGINT NOT NULL,
  title          VARCHAR(200) NOT NULL,
  artist         VARCHAR(200) NOT NULL,
  artwork_url    VARCHAR(500) NULL,
  genre          VARCHAR(60) NULL,
  PRIMARY KEY (issue_track_id),
  UNIQUE KEY uq_track_position (issue_id, position),
  UNIQUE KEY uq_track_once (issue_id, track_id),
  CONSTRAINT fk_track_issue FOREIGN KEY (issue_id)
    REFERENCES issue (issue_id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE analysis (
  analysis_id CHAR(36) NOT NULL,
  device_id   CHAR(36) NOT NULL,
  status      ENUM('analyzing','fetching','done','failed','canceled')
              NOT NULL DEFAULT 'analyzing',
  tracks      JSON NOT NULL,
  track_key   CHAR(64) NOT NULL,
  issue_id    CHAR(36) NULL,
  invite_id   CHAR(36) NULL,
  error_code  VARCHAR(40) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (analysis_id),
  KEY idx_analysis_device_created (device_id, created_at),
  CONSTRAINT fk_analysis_device FOREIGN KEY (device_id)
    REFERENCES device (device_id) ON DELETE CASCADE,
  CONSTRAINT fk_analysis_issue FOREIGN KEY (issue_id)
    REFERENCES issue (issue_id) ON DELETE SET NULL
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE recommendation (
  rec_id        CHAR(36) NOT NULL,
  issue_id      CHAR(36) NOT NULL,
  category      ENUM('movie','book','travel','perfume') NOT NULL,
  `rank`        TINYINT NOT NULL,
  source        ENUM('tmdb','kakao_book','opentripmap','perfume_db') NOT NULL,
  source_id     VARCHAR(64) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  meta          VARCHAR(200) NOT NULL,
  description   VARCHAR(300) NULL,
  image_url     VARCHAR(500) NULL,
  axis_energy   TINYINT UNSIGNED NOT NULL,
  axis_digital  TINYINT UNSIGNED NOT NULL,
  axis_vivid    TINYINT UNSIGNED NOT NULL,
  axis_abstract TINYINT UNSIGNED NOT NULL,
  axis_cold     TINYINT UNSIGNED NOT NULL,
  axis_novel    TINYINT UNSIGNED NOT NULL,
  axis_social   TINYINT UNSIGNED NOT NULL,
  axis_dramatic TINYINT UNSIGNED NOT NULL,
  match_score   TINYINT UNSIGNED NOT NULL,
  reason        VARCHAR(300) NOT NULL,
  mappings      JSON NOT NULL,
  evidence      VARCHAR(400) NOT NULL,
  tags          JSON NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (rec_id),
  UNIQUE KEY uq_rec_rank (issue_id, category, `rank`),
  CONSTRAINT fk_rec_issue FOREIGN KEY (issue_id)
    REFERENCES issue (issue_id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE stamp (
  rec_id     CHAR(36) NOT NULL,
  stamp      ENUM('love','near','unsure','no') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (rec_id),
  CONSTRAINT fk_stamp_rec FOREIGN KEY (rec_id)
    REFERENCES recommendation (rec_id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;
