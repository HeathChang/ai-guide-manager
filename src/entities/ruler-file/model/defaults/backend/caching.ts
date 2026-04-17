export const backendCaching = `# Caching

> 캐싱 전략·무효화·일관성 규칙이다.

## 캐시 레벨

| 레벨 | 예시 | 용도 |
|------|------|------|
| 로컬 (in-memory) | Caffeine, Guava | 단일 인스턴스 고빈도 조회 |
| 분산 | Redis, Memcached | 멀티 인스턴스 공유 |
| HTTP / CDN | Cache-Control, ETag | 정적 자원, 공개 API |
| DB | Query cache | 읽기 부하 분산 |

## TTL 정책

- 모든 캐시에 **TTL을 명시**한다 — 무한 캐시 금지.
- 기본 TTL은 데이터 변동 주기의 **10~30%** 수준.
- 고빈도 쓰기 데이터는 짧게, 정적 데이터는 길게.

## 무효화 전략

| 전략 | 언제 |
|------|------|
| TTL 만료 | 일관성 요구 낮음 |
| Write-through | 쓰기 즉시 캐시 갱신 |
| Write-behind | 쓰기 비동기 반영 (유실 위험) |
| Cache-aside | 읽기 시 로드, 쓰기 시 invalidate |

- 무효화 실패가 **치명적인 경우** 짧은 TTL로 안전망 구축.

## 일관성 이슈

- **Thundering herd**: 인기 키 만료 동시 재계산 → Jitter + 락.
- **Cache penetration**: 존재하지 않는 키 반복 조회 → Negative cache.
- **Cache avalanche**: 동시 만료 → TTL에 Jitter 추가.

## 키 설계

- 네임스페이스 분리: \`user:v1:42\`.
- 버전을 키에 포함 → 스키마 변경 시 자동 무효화.
- 키 길이를 제한 (Redis는 권장 1KB 이내).

## AI 행동 규칙

- 캐시 추가 전 **캐시할 가치**(조회 빈도 × 계산 비용)를 확인.
- 무효화 실패 경로를 설계에 포함.
- 민감 데이터는 분산 캐시에 저장하지 않거나 암호화.

## 금지 패턴

- TTL 없는 캐시
- 쓰기 후 무효화 누락
- 캐시를 1차 저장소로 사용 (유실 가정 필수)
`;
