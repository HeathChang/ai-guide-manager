export const frameworkRails = `---
title: 프레임워크 — Ruby on Rails
stack: backend
category: 프레임워크
extends: [base.md, backend.md]
---

# Ruby on Rails

> \`backend.md\` 를 상속. Rails 7+ / Ruby 3.2+ 전제.
> Convention over Configuration. **컨벤션을 거스르는 결정은 명시적 근거가 있어야 한다.**

## 구조

\`\`\`
app/
├ controllers/
├ models/
├ services/             도메인 서비스 (Rails 기본 아님 — 직접 도입)
├ jobs/                 ActiveJob
├ mailers/
├ views/
└ channels/             ActionCable
\`\`\`

- 도메인 로직이 커지면 \`app/services/\` 또는 \`app/operations/\` 패턴(예: dry-rb interactors).
- Fat Model / Fat Controller 둘 다 안티패턴 — service로 추출.

## Convention

- 클래스명 = 파일명 = 테이블명 (자동 매핑).
- 컨벤션을 깬 경우 \`self.table_name = '...'\` 명시.

## ActiveRecord

- N+1 방지: \`includes\`, \`preload\`, \`eager_load\` 차이 이해:
  - \`includes\` — Rails 결정 (JOIN or 2-query).
  - \`preload\` — 강제 2-query.
  - \`eager_load\` — 강제 JOIN.
- \`bullet\` gem으로 개발 중 N+1 자동 감지.

## Strong Parameters

- mass assignment 방어:
  \`\`\`ruby
  def user_params
    params.require(:user).permit(:email, :name)   # admin 같은 민감 필드 제외
  end
  \`\`\`
- \`permit!\` (모든 키 허용) 절대 금지.
  - 근거: 요청 본문의 모든 키가 모델 속성에 그대로 대입된다. \`admin: true\` 같은 필드를 끼워 넣는 권한 상승이 바로 가능해진다.

## Validation

- 모델 검증:
  \`\`\`ruby
  validates :email, presence: true, uniqueness: true, format: URI::MailTo::EMAIL_REGEXP
  validates :password, length: { minimum: 8 }
  \`\`\`
- DB 제약(unique index)도 함께 — 모델 검증만으로는 race condition.

## Controller — 얇게

- 검증 + 서비스 호출 + 응답.
- 표준 7개 액션(\`index\`, \`show\`, \`new\`, \`create\`, \`edit\`, \`update\`, \`destroy\`) 외엔 다른 controller로 분리 검토.
  - 근거: Rails 라우팅(\`resources :users\`)이 7개 액션을 자동 매핑. 8번째 액션을 추가하면 라우트를 수동 선언해야 하고, 컨벤션을 거스른다. 새 책임은 거의 항상 새 리소스(\`UserPasswordsController\`, \`UserSessionsController\`) 로 분리하는 게 더 깨끗하다.

## Service 객체

- Rails는 기본 service 폴더가 없음 — 도메인이 커지면 직접 도입:
  \`\`\`ruby
  # app/services/users/sign_up.rb
  module Users
    class SignUp
      def initialize(params); @params = params; end
      def call
        ApplicationRecord.transaction do
          user = User.create!(@params)
          Mailer.welcome(user).deliver_later
          user
        end
      end
    end
  end
  \`\`\`
- 호출: \`Users::SignUp.new(params).call\`.

## Routes

- \`config/routes.rb\` — \`resources\` 컨벤션 활용.
- \`match :all\` 금지 — 명시적 HTTP 메서드.
  - 근거: GET 으로도 상태를 바꿀 수 있게 되어 프리페치·크롤러·브라우저 캐시가 의도치 않게 데이터를 변경한다.
- API 라우트는 \`namespace :api do; namespace :v1 do ... end; end\` 로 버전 명시.

## API 전용 vs Full-stack

- API only: \`rails new app --api\` — Action Controller::API 베이스, view 미들웨어 제거.
- Hotwire(Turbo + Stimulus) 풀스택이면 traditional view + Strong Parameters + Pundit/CanCanCan.

## 인증 / 인가

- Devise(전통) 또는 Rails 7.1+ 의 ActiveRecord \`authenticate_by\`(has_secure_password 모델에서 타이밍-세이프 인증, 간단한 경우). Rails 8은 \`bin/rails generate authentication\` 으로 세션 기반 인증 스캐폴드를 별도 제공.
- 인가: Pundit (policy 객체) 권장 — controller에 if/else 분기 금지.
  - 근거: controller 에 흩어진 조건문은 새 액션이 추가될 때마다 빠뜨리기 쉽다. policy 객체는 빠뜨린 곳이 한곳에 드러난다.

## 비동기

- ActiveJob — Sidekiq backend 권장.
- 이메일 송신, 외부 API 호출, 대용량 처리는 모두 job.
- \`perform_later\` — 즉시 실행은 \`perform_now\` (테스트에만).

## 캐싱

- low-level cache: \`Rails.cache.fetch('key', expires_in: 1.hour) { ... }\`.
- fragment cache, russian doll caching for views.
- Redis backend.

## 보안

- CSRF 자동 활성 — API mode면 토큰 인증 패턴.
- SQL Injection: ActiveRecord 사용하면 안전. raw SQL은 \`sanitize_sql_array\` 강제.
- 시크릿: \`Rails.application.credentials\` (encrypted) — \`master.key\` 는 절대 커밋 X.
  - 근거: 이 키 하나면 암호화된 credentials 전체가 평문으로 열린다. 커밋되는 순간 저장소 접근 권한이 곧 운영 시크릿 접근 권한이 된다.

## 마이그레이션

- reversible — \`change\` 메서드로. 비reversible 변경은 \`up\` / \`down\` 분리.
- prod 큰 테이블에 컬럼 추가/인덱스: \`disable_ddl_transaction!\` + \`add_index :table, :col, algorithm: :concurrently\` (Postgres).
- 마이그레이션은 코드와 함께 PR.

## 로깅

- Rails.logger — 기본 사용.
- 구조화: lograge (JSON) 권장 — 프로덕션 ELK/Datadog 친화.
- 민감 정보 필터: \`config.filter_parameters\`.

## 테스트

- RSpec (커뮤니티 표준) 또는 Minitest (Rails 기본).
- FactoryBot으로 fixture 대체.
- 시스템 테스트: Capybara.
- 외부 HTTP: WebMock + VCR.

## API 응답 직렬화

- Active Model Serializers (AMS) — 옛 표준, 유지보수 약함.
- 현재 권장: **jbuilder** (간단) 또는 **alba** / **panko_serializer** (빠름).
- JSON:API 스펙 필요하면 \`jsonapi-serializer\`.

## 환경 변수

- \`dotenv-rails\` 또는 \`Rails.application.credentials\`.
- \`ENV['X']\` 직접 참조보다 config 객체로 1회 로드.

## AI 행동 규칙

- Controller에 비즈니스 로직 누적 시 service 객체로 분리.
- \`params.permit!\` 발견 시 즉시 명시 필드 권고.
- raw SQL 문자열 합치기 발견 시 ORM 또는 parameterized로 교체.
- N+1 가능성 쿼리 발견 시 \`includes\` 추가.
- 큰 테이블에 마이그레이션 추가 시 \`concurrently\` 옵션 권고.

## 패턴 (DO / DON'T)

### Strong Parameters

\`\`\`ruby
# DON'T
def user_params
  params.permit!                          # 모든 키 허용 — admin 필드까지
end

# DO
def user_params
  params.require(:user).permit(:email, :name)
end
\`\`\`

### Service 객체

\`\`\`ruby
# DON'T — controller에 비즈니스 로직
class UsersController < ApplicationController
  def create
    @user = User.new(user_params)
    if @user.save
      Mailer.welcome(@user).deliver_later
      Crm.sync(@user)
      render json: @user
    else
      render json: @user.errors, status: 422
    end
  end
end

# DO
class UsersController < ApplicationController
  def create
    result = Users::SignUp.new(user_params).call
    render json: result.user, status: 201
  rescue ActiveRecord::RecordInvalid => e
    render json: e.record.errors, status: 422
  end
end
\`\`\`

### N+1

\`\`\`ruby
# DON'T
@posts = Post.all
# view: each post.author.name → 매번 쿼리

# DO
@posts = Post.includes(:author).all
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| Fat controller | service 객체 |
| \`permit!\` | 명시 필드 \`permit(:a, :b)\` |
| raw SQL 합치기 | ORM 또는 \`sanitize_sql_array\` |
| 동기 외부 API 호출 in controller | ActiveJob |
| \`master.key\` 커밋 | gitignore 필수 |
| \`puts\` 디버깅 | Rails.logger |

## 적용 범위와 경계

이 문서는 **Rails 의 컨벤션, ActiveRecord, Strong Parameters, 컨트롤러/서비스 분리**만 다룬다. 배포(Puma 설정, 자산 파이프라인 운영)는 다루지 않는다.

여기서 다루지 않는 것 → 레이어 구조의 원칙은 \`backend.md\`, URL·상태 코드는 \`api-design.md\`, 인증 정책은 \`auth.md\`, 쿼리·인덱스·마이그레이션 전략은 \`database.md\`, 에러 분류는 \`error-handling.md\`.

**이 문서는 인가 정책을 대신 정하지 않는다.** 누가 무엇에 접근할지는 제품 결정이다. 명시되지 않았으면 추측하지 말고 유저에게 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **Strong Parameters vs 편의** — 허용 목록이 이긴다. \`permit!\` 은 어떤 이유로도 쓰지 않는다.
- **컨벤션 vs 개인 취향** — Rails 컨벤션이 이긴다. 이름과 위치를 임의로 바꾸면 프레임워크의 자동 연결이 끊긴다.
- **Controller 얇게 유지 vs 코드 줄 수** — 얇게가 이긴다. 로직은 모델이나 서비스 객체로 뺀다.
- **이 문서 vs \`backend.md\`** — 프레임워크 관례는 이 문서가 이기지만, 레이어 경계와 DTO 분리는 \`backend.md\` 가 이긴다.

## 자가 점검

기능을 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] Controller 가 얇다 — 비즈니스 로직을 모델이나 서비스 객체로 뺐다
- [ ] Strong Parameters 로 허용 키를 명시했다 — \`permit!\` 이 없다
- [ ] 모델에 검증(validates)이 있고 DB 제약과 어긋나지 않는다
- [ ] 관계 순회에 \`includes\` 를 적용해 N+1 이 없다
- [ ] 라우트를 \`resources\` 컨벤션으로 선언했다
- [ ] 인가 체크가 컨트롤러 액션마다 있다
- [ ] 시크릿을 credentials 나 환경 변수로 읽는다
- [ ] 마이그레이션에 롤백 경로가 있고 데이터 손실 가능한 변경을 분리했다
- [ ] API 응답을 직렬화 계층으로 변환한다 — 모델을 그대로 렌더하지 않는다
`;
