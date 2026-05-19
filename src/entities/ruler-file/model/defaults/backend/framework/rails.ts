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
- API 라우트는 \`namespace :api do; namespace :v1 do ... end; end\` 로 버전 명시.

## API 전용 vs Full-stack

- API only: \`rails new app --api\` — Action Controller::API 베이스, view 미들웨어 제거.
- Hotwire(Turbo + Stimulus) 풀스택이면 traditional view + Strong Parameters + Pundit/CanCanCan.

## 인증 / 인가

- Devise (전통) 또는 Rails 7.1+ 기본 \`authenticate_by\` (간단한 경우).
- 인가: Pundit (policy 객체) 권장 — controller에 if/else 분기 금지.

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
`;
