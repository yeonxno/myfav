$ErrorActionPreference = 'Stop'
$outputDir = if ($PSScriptRoot) { $PSScriptRoot } else { Join-Path (Get-Location) 'docs' }
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 2000,1560
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$svg = [System.Collections.Generic.List[string]]::new()
$svg.Add('<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1560" viewBox="0 0 2000 1560"><defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#64748b"/></marker></defs>')
function Color($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function Rect($x,$y,$w,$h,$fill,$stroke='#d5deea') {
 $brush = [System.Drawing.SolidBrush]::new((Color $fill)); $pen = [System.Drawing.Pen]::new((Color $stroke),2)
 $g.FillRectangle($brush,$x,$y,$w,$h); $g.DrawRectangle($pen,$x,$y,$w,$h)
 $svg.Add("<rect x='$x' y='$y' width='$w' height='$h' fill='$fill' stroke='$stroke' stroke-width='2'/>")
 $brush.Dispose(); $pen.Dispose()
}
function Txt($x,$y,$value,$size=24,$color='#17263b',$bold=$false) {
 $style = if($bold){[System.Drawing.FontStyle]::Bold}else{[System.Drawing.FontStyle]::Regular}
 $font = [System.Drawing.Font]::new('Malgun Gothic',$size,$style,[System.Drawing.GraphicsUnit]::Pixel)
 $brush = [System.Drawing.SolidBrush]::new((Color $color))
 $g.DrawString($value,$font,$brush,[single]$x,[single]$y)
 $escaped = [System.Security.SecurityElement]::Escape($value); $weight=if($bold){700}else{400}
 $baseline=$y+$size+2
 $svg.Add("<text x='$x' y='$baseline' font-family='Malgun Gothic, sans-serif' font-size='$size' font-weight='$weight' fill='$color'>$escaped</text>")
 $font.Dispose(); $brush.Dispose()
}
function Arrow($x1,$y1,$x2,$y2) {
 $pen=[System.Drawing.Pen]::new((Color '#64748b'),3)
 $cap=[System.Drawing.Drawing2D.AdjustableArrowCap]::new(5,6); $pen.CustomEndCap=$cap
 $g.DrawLine($pen,$x1,$y1,$x2,$y2)
 $svg.Add("<line x1='$x1' y1='$y1' x2='$x2' y2='$y2' stroke='#64748b' stroke-width='3' marker-end='url(#a)'/>")
 $pen.Dispose(); $cap.Dispose()
}
function Box($x,$y,$w,$h,$title,$lines,$fill='#ffffff') {
 Rect $x $y $w $h $fill
 Txt ($x+22) ($y+18) $title 27 '#17263b' $true
 $lineY=$y+64
 foreach($line in $lines){Txt ($x+22) $lineY $line 22 '#465870'; $lineY+=34}
}
Rect 0 0 2000 1560 '#f4f7fb' '#f4f7fb'
Txt 55 35 '취향 번역기 · 시스템 구성도' 46 '#14263f' $true
Txt 58 102 'MYFAV   /   현재 코드 + docs 교차 분석   /   2026.10.04' 23 '#61758c'
Box 60 170 490 115 '프론트 빌드 · React 19 / TS' @('Vite → dist → ait build → myfav.ait') '#e8f0ff'
Arrow 550 228 700 228
Txt 577 188 'ait deploy' 20
Box 710 170 590 115 '앱인토스 배포' @('번들 업로드 → 검토·출시 → 토스 앱에서 실행') '#e8f0ff'
Box 1480 170 460 115 '그림 읽는 법' @('화살표: 요청·호출 방향 (응답은 역방향)') '#ffffff'

Txt 65 325 '01  사용자 단말' 25 '#235bc1' $true
Rect 60 375 450 690 '#eaf1ff' '#c5d7f7'
Box 80 395 410 240 '토스 앱 · WebView' @('iOS / Android','React 미니앱 화면','음악 선택 → 분석 → 취향 프로필','영화 · 책 · 여행 · 향수 추천','반응 스탬프 · 지난 이슈 조회')
Box 80 660 410 180 '기기 식별 · 플랫폼 연동' @('익명 device_id 저장','Toss Storage / localStorage 폴백','SDK 공유 · 딥링크 · 뒤로가기')
Box 80 865 410 175 'API 클라이언트' @('VITE_API_BASE_URL','JSON + X-Device-Id','상태 조회: 1초 간격 / 최대 60초')

Txt 645 325 '02  운영 PC · 현재 임시 서버 구성' 25 '#087a69' $true
Rect 640 375 720 920 '#e7f5f0' '#b6ddcf'
Box 665 395 670 105 'Cloudflare Quick Tunnel' @('공개 HTTPS → cloudflared → 127.0.0.1:8001')
Arrow 510 450 660 450
Txt 522 409 'HTTPS API' 19
Arrow 1000 500 1000 540
Box 665 545 670 180 'FastAPI · Uvicorn' @('/api/v1  ·  기기 / 홈 / 음악 검색 / 분석','이슈 / 분야별 추천 / 상세 / 스탬프 / 기록 삭제','GET /music/search → iTunes 조회 · 60초 캐시')
Arrow 1000 725 1000 768
Box 665 775 670 230 '분석 파이프라인 · BackgroundTasks' @('POST /analyses → 202 + analysis_id 즉시 반환','취향 1 + 분야별 2묶음 × 4 = AI 9개 병렬 호출','후보 조회 병렬 실행 → 분야별 최대 3개 채택','8축 연결 점수 계산 → 결과 저장 → done','동일 기기·곡 조합은 기존 이슈 재사용')
Arrow 830 1005 830 1048
Arrow 1190 1048 1190 1005
Box 665 1055 670 215 'MySQL · SQLAlchemy + PyMySQL' @('기록: device / analysis / issue / issue_track','추천·반응: recommendation / stamp','자체 데이터: perfume / image_pool','향수 약 150건 · 이미지 파일명과 URL 저장')

Txt 1485 325 '03  외부 서비스' 25 '#8b50ab' $true
Box 1480 395 460 145 'Apple iTunes Search' @('곡명 · 아티스트 · 장르 · 앨범 아트','음악 검색은 백엔드가 대신 호출') '#f7effc'
Arrow 1335 625 1410 625
Arrow 1410 625 1410 466
Arrow 1410 466 1475 466
Box 1480 590 460 160 'AI 제공사' @('현재: Anthropic','전환 가능: OpenAI (환경변수 설정)','곡 메타데이터 → 취향·추천 JSON') '#f7effc'
Arrow 1335 825 1430 825
Arrow 1430 825 1430 675
Arrow 1430 675 1475 675
Box 1480 800 460 210 '추천 후보 정보 조회' @('TMDB → 영화 정보·포스터','카카오 책 검색 → 도서 정보·표지','OpenTripMap → 여행지 검증','향수는 MySQL 자체 데이터와 대조') '#f7effc'
Arrow 1335 905 1475 905
Box 1480 1055 460 215 '이미지 전달' @('여행·무드: PC의 이미지 파일','FastAPI /static/travel/* 로 제공','앨범·포스터·책 표지: 외부 URL','화면에서 URL로 이미지 로드') '#fff7e9'

Box 60 1080 450 215 '사용자에게 제공되는 결과' @('8개 감각 축 · 취향 이름 · 태그','추천 최대 12건 + 연결 이유','서버에 이슈 보관 · 전체 삭제','공유 링크로 취향 프로필 조회') '#ffffff'

Rect 60 1330 1880 165 '#ffffff'
Txt 82 1349 '현재 구현 기준 · 문서와 다른 점' 26 '#17263b' $true
Txt 82 1395 'iTunes 직접 호출 → 서버 프록시   |   AI 단일 호출 → 9개 병렬 호출   |   화면 분석 제한 30초 → 60초' 22 '#465870'
Txt 82 1433 '후순위: 친구 궁합·취향 변화  /  카드 이미지 저장: 미구현  /  PC·MySQL·백엔드·터널이 실행 중이어야 API 이용 가능' 22 '#465870'
Txt 65 1512 '근거: API·DB·기능·화면흐름 명세, backend/README, src/api·platform, backend/app·db   |   키·개인정보·임시 도메인은 생략' 18 '#61758c'
$svg.Add('</svg>')
$bitmap.Save((Join-Path $outputDir 'system-architecture.png'),[System.Drawing.Imaging.ImageFormat]::Png)
[System.IO.File]::WriteAllLines((Join-Path $outputDir 'system-architecture.svg'),$svg,[System.Text.UTF8Encoding]::new($false))
$g.Dispose(); $bitmap.Dispose()
Write-Output 'Created system-architecture.png and system-architecture.svg (2000 x 1560).'
