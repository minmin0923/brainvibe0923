<!-- Keep a Changelog 형식(templates/vendor/keep-a-changelog)을 따릅니다. 최신 버전이 맨 위, 날짜는 YYYY-MM-DD. -->

# 변경 기록

이 프로젝트의 주요 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를, 버전 규칙은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

## [Unreleased]

### 추가 (Added)

-

## [1.4.0] - 2026-10-13

### 추가 (Added)

- 주문 목록에서 배송 상태로 거르는 필터

### 변경 (Changed)

- 결제 완료 화면의 안내 문구를 더 짧게 정리

### 지원 중단 예정 (Deprecated)

- `/v1/orders/search` API. 2027-01-31에 제거 예정이며 `/v2/orders`를 쓰세요.

### 제거 (Removed)

- 사용하지 않는 구 쿠폰 화면

### 수정 (Fixed)

- 일부 안드로이드 기기에서 주소 검색 창이 닫히지 않던 문제

### 보안 (Security)

- 비밀번호 재설정 링크의 유효 시간을 24시간에서 30분으로 단축

[Unreleased]: https://github.com/OWNER/REPO/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/OWNER/REPO/compare/v1.3.0...v1.4.0
