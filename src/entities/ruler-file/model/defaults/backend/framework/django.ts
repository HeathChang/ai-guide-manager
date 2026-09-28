export const frameworkDjango = `---
title: 프레임워크 — Django
stack: backend
category: 프레임워크
extends: [base.md, backend.md]
---

# Django

> \`backend.md\` 를 상속. Django 5+ / Python 3.11+ 전제.
> 신규 API 서버는 **Django REST Framework (DRF)** 또는 **Django Ninja** 와 함께 사용.

## 프로젝트 구조 — App 단위

\`\`\`
project/
├ manage.py
├ project/                  설정 패키지
│  ├ settings/
│  │  ├ base.py
│  │  ├ dev.py
│  │  └ prod.py
│  ├ urls.py
│  └ asgi.py
└ apps/
   ├ users/                 도메인 1 = Django app 1
   │  ├ apps.py
   │  ├ models.py
   │  ├ serializers.py      DRF / Ninja schema
   │  ├ views.py
   │  ├ urls.py
   │  ├ services.py         비즈니스 로직
   │  ├ admin.py
   │  └ migrations/
   └ orders/
\`\`\`

- \`models.py\`, \`views.py\` 가 500줄 넘으면 분리 (\`models/\` 패키지).
- 비즈니스 로직은 \`services.py\` 에 — view에 절대 금지.
  - 근거: view 에 있는 로직은 HTTP 요청 없이 실행할 수 없다. 관리 커맨드·Celery 태스크·테스트에서 같은 규칙을 재사용하지 못하고 복사된다.

## Settings — 환경별 분리

- \`settings/base.py\` 공통 + \`dev.py\` / \`prod.py\` / \`test.py\` 가 \`base\` 상속.
- 시크릿은 환경변수. \`python-decouple\` 또는 \`django-environ\`:
  \`\`\`py
  from environ import Env
  env = Env()
  SECRET_KEY = env('SECRET_KEY')
  DEBUG = env.bool('DEBUG', default=False)
  \`\`\`
- 프로덕션에서 \`DEBUG = True\` 절대 금지 — 에러 페이지에 코드/환경 노출.
- \`ALLOWED_HOSTS\` 명시. \`['*']\` 금지.
  - 근거: ALLOWED_HOSTS 는 Host 헤더 검증으로 HTTP Host header attack(캐시 포이즈닝, 패스워드 리셋 위변조)을 차단한다. \`['*']\` 는 검증 스킵이라 공격자가 임의 Host로 요청 가능 → 잘못된 도메인으로 패스워드 리셋 이메일이 발송될 수 있다.

## Models — ORM

- 비즈니스 메서드를 model에 두지 마라 (fat model 안티패턴).
  - 객체 자체에 대한 단순 메서드(\`is_active\`, \`full_name\`)는 OK.
  - 외부 시스템 호출, 복잡한 도메인 로직은 service.
- 마이그레이션은 코드와 함께 PR. \`makemigrations\` → 리뷰 → \`migrate\`.
- N+1 방지: \`select_related\` (FK), \`prefetch_related\` (M2M, reverse FK).
- 인덱스 명시: \`Meta.indexes\` 또는 필드의 \`db_index\`.

## Querysets

- 항상 lazy — 평가 시점 인지.
- \`only\` / \`defer\` 로 필요 컬럼만.
- \`.values()\` / \`.values_list()\` 로 dict/tuple 반환 (직렬화 직전 사용).
- raw SQL은 마지막 수단 — \`with params\` 강제 (포지셔널 \`%s\`), 문자열 합치기 금지.
  - 근거: 문자열로 조립한 SQL 은 입력이 곧 코드가 된다. 이스케이프를 손으로 하는 방식은 언젠가 한 경로를 빠뜨린다.

## DRF (REST API)

- ViewSet + Router 패턴 권장 — URL 라우팅 자동.
- Serializer로 검증 + 직렬화:
  \`\`\`py
  class UserSerializer(serializers.ModelSerializer):
      class Meta:
          model = User
          fields = ['id', 'email', 'name']
          read_only_fields = ['id']
  \`\`\`
- \`fields = '__all__'\` 금지 — 신규 필드 추가 시 자동 노출 위험(mass assignment).
- 입력/출력 Serializer를 분리하는 것이 안전: \`UserCreateSerializer\` vs \`UserSerializer\`.
- Permission 명시: \`permission_classes = [IsAuthenticated]\`. 디폴트 변경하지 마라.
  - 근거: 전역 디폴트를 느슨하게 바꾸면 이후 추가되는 모든 뷰가 조용히 열린 채로 태어난다. 뷰마다 명시하면 빠뜨린 곳이 코드에서 눈에 보인다.

## Django Ninja (DRF 대안)

- FastAPI 스타일 — type hint 기반 자동 검증·OpenAPI.
- 신규 프로젝트라면 강력한 대안 — type hint 기반이라 Serializer 클래스 정의 없이 함수 시그니처로 검증/직렬화가 끝나 보일러플레이트가 적다.

## URL

- 각 app이 \`urls.py\` 소유. project urls는 \`include\` 만.
- URL name 컨벤션: \`users:detail\` (namespace).
- \`reverse(...)\` / \`{% url ... %}\` 사용 — 하드코딩 금지.
  - 근거: URL 을 하드코딩하면 경로를 바꿀 때 문자열을 전부 찾아 고쳐야 한다. 놓친 곳은 컴파일 에러 없이 404 로만 드러난다.

## Forms / Validation

- API에서는 Serializer 또는 Ninja schema가 폼 역할.
- 기존 Django Form은 server-rendered template에만.
- 모든 사용자 입력 검증 — 신뢰 금지.
  - 근거: 클라이언트에서 온 값은 전부 조작 가능하다. 검증되지 않은 값이 ORM 필터나 파일 경로에 닿는 순간 그게 취약점이다.

## 보안

- CSRF: 세션 쿠키 기반이면 활성 유지. 토큰 인증 API는 view 단위 \`@csrf_exempt\` 보다 DRF의 SessionAuth/TokenAuth 분리.
- \`SECURE_*\` 설정 prod: \`SECURE_SSL_REDIRECT=True\`, \`SESSION_COOKIE_SECURE=True\`, \`CSRF_COOKIE_SECURE=True\`, \`SECURE_HSTS_SECONDS=31536000\`.
- 패스워드: \`AUTH_PASSWORD_VALIDATORS\` 활성.
- ORM 사용하면 SQL Injection은 기본 안전 — raw SQL 사용 시에만 위험.

## 인증

- \`django.contrib.auth\` 가 핵심. AbstractUser/AbstractBaseUser 확장으로 커스텀 User 모델 — **프로젝트 시작 시 결정**.
- 토큰: DRF Token / SimpleJWT.
- 권한은 \`@permission_required\` 또는 DRF \`permission_classes\` — 룰 한 곳에 모으기.

## 비동기

- Django 4.1+ async view 지원: \`async def view(request)\`.
- ORM은 \`asgiref.sync_to_async\` 또는 async ORM API (\`User.objects.aget(...)\`).
- 무거운 작업: Celery / RQ — 절대 request 동기 처리 금지.
  - 근거: 동기 처리하면 그 요청이 워커 하나를 점유한다. 동시 요청이 워커 수를 넘는 순간 서비스 전체가 응답하지 않는다.

## 캐싱

- \`django.core.cache\` — Redis backend 권장.
- view 캐시 (\`cache_page\`), low-level 캐시 (\`cache.get/set\`).
- 캐시 키 네이밍 컨벤션 합의 (\`user:{id}:profile\`).
- 무효화 정책 명시 — TTL 또는 명시적 invalidation.

## 로깅

- \`LOGGING\` 설정에 JSON formatter (\`python-json-logger\`).
- view/service에서는 \`logger = logging.getLogger(__name__)\` 사용.
- \`print()\` 금지.
  - 근거: 레벨도 구조도 없어 수집·검색·알림 대상이 되지 못한다. 운영에서 그 출력은 사실상 사라진 것과 같다.

## 테스트

- \`pytest-django\` 권장 — Django 내장 TestCase보다 fixture/parametrize가 강력.
- 한 테스트 = 한 동작. fixture로 setup 공유.
- DB는 트랜잭션 롤백 패턴 또는 testcontainers Postgres.

## Admin

- 공개 사이트와 admin URL 다른 prefix (\`/staff-admin/\` 등).
- \`list_display\`, \`search_fields\`, \`list_filter\` 명시 — 큰 테이블의 admin 페이지가 N+1로 죽지 않게 \`list_select_related\`.

## AI 행동 규칙

- view에 비즈니스 로직(외부 API 호출, 복잡한 분기) 발견 시 service.py로 추출.
- \`Meta.fields = '__all__'\` 발견 시 즉시 명시 필드 목록으로 교체.
- raw SQL 문자열 합치기 발견 시 paramatized query로 교체.
- \`DEBUG = True\` 가 \`settings/prod.py\` 또는 default에 발견 시 즉시 false.
- \`print()\` 사용 시 logger로 교체.

## 패턴 (DO / DON'T)

### Serializer 안전성

\`\`\`py
# DON'T
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'              # 새 필드 자동 노출

# DO
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name']
        read_only_fields = ['id']
\`\`\`

### N+1 방지

\`\`\`py
# DON'T
posts = Post.objects.all()
for p in posts:
    print(p.author.name)                # 매번 쿼리

# DO
posts = Post.objects.select_related('author').all()
\`\`\`

### Service 분리

\`\`\`py
# DON'T — view에 비즈니스 로직
def create_user(request):
    data = json.loads(request.body)
    user = User.objects.create(...)
    send_welcome_email(user)
    sync_to_crm(user)
    return JsonResponse(...)

# DO
# services.py
def create_user(payload: CreateUserPayload) -> User:
    user = User.objects.create(...)
    send_welcome_email(user)
    sync_to_crm(user)
    return user

# views.py
def create_user_view(request):
    payload = serializer.validated_data
    user = services.create_user(payload)
    return Response(UserSerializer(user).data)
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| view에 비즈니스 로직 | services.py |
| \`fields = '__all__'\` | 명시 fields |
| raw SQL 문자열 합치기 | ORM 또는 parameterized |
| 동기 view에서 외부 API 호출 + 응답 지연 | Celery 비동기 |
| \`print()\` | logger |
| \`DEBUG=True\` 프로덕션 | \`False\` + Sentry |

## 적용 범위와 경계

이 문서는 **Django 앱 구조, ORM, DRF/Ninja, 폼 검증, settings 분리**만 다룬다. 배포(gunicorn, ASGI 서버, 정적 파일 서빙)는 다루지 않는다.

여기서 다루지 않는 것 → 레이어 구조의 원칙은 \`backend.md\`, URL·상태 코드는 \`api-design.md\`, 인증 정책은 \`auth.md\`, 쿼리·인덱스·마이그레이션 전략은 \`database.md\`, 에러 분류는 \`error-handling.md\`.

**이 문서는 권한 정책을 대신 정하지 않는다.** 누가 무엇에 접근할지는 제품 결정이다. 명시되지 않았으면 추측하지 말고 유저에게 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **명시적 권한 선언 vs 전역 디폴트 완화** — 명시가 이긴다. 전역 \`DEFAULT_PERMISSION_CLASSES\` 를 느슨하게 바꾸지 않는다.
- **View 얇게 유지 vs 코드 줄 수** — 얇게가 이긴다. 비즈니스 로직은 \`services.py\` 로 뺀다.
- **ORM 편의 vs 쿼리 수** — 쿼리 수가 이긴다. \`select_related\` / \`prefetch_related\` 없이 관계를 순회하지 않는다.
- **이 문서 vs \`backend.md\`** — 프레임워크 관례는 이 문서가 이기지만, 레이어 경계와 DTO 분리는 \`backend.md\` 가 이긴다.

## 자가 점검

기능을 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] View 에 비즈니스 로직이 없다 — \`services.py\` 로 뺐다
- [ ] DRF View 에 \`permission_classes\` 를 명시했다
- [ ] 모든 사용자 입력을 serializer 나 form 으로 검증한다
- [ ] 관계 순회에 \`select_related\` / \`prefetch_related\` 를 적용해 N+1 이 없다
- [ ] URL 을 \`reverse()\` / \`{% url %}\` 로 참조한다 — 하드코딩이 없다
- [ ] settings 가 환경별로 분리돼 있고 \`SECRET_KEY\` 가 환경 변수다
- [ ] \`DEBUG\` 가 운영 설정에서 꺼져 있고 \`ALLOWED_HOSTS\` 가 지정돼 있다
- [ ] \`print()\` 대신 logging 모듈을 쓴다
- [ ] 마이그레이션 파일을 생성했고 데이터 손실 가능한 변경을 분리했다
`;
