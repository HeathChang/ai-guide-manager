export const frameworkVanilla = `---
title: 프레임워크 — Vanilla TypeScript
stack: frontend
category: 프레임워크
extends: [base.md]
---

# Vanilla TypeScript

> \`base.md\` 를 상속. 프레임워크 없이 표준 DOM API + TypeScript로 작성하는 경우.
> 작은 위젯, embed 스크립트, 정적 사이트 인터랙티브, 또는 학습 목적에 적합.
> 페이지가 커지면 **빠르게 프레임워크로 갈아탈 시점**을 인지하라 — vanilla로 컴포넌트 트리, 상태 동기화, 라우팅을 직접 구현하면 결국 자체 프레임워크를 재발명한다.

## 빌드 / 모듈

- 빌드 도구: **Vite** + TypeScript. webpack 신규 도입 금지.
  - 근거: webpack 은 같은 결과를 얻는 데 설정 파일과 로더 체인이 훨씬 많이 필요하다. 그 설정은 유지보수 대상이 되고, 대개 아무도 이해하지 못한 채 복사된다.
- ES Modules 표준. CommonJS 신규 작성 금지.
  - 근거: ESM 은 정적 분석이 가능해 번들러가 쓰지 않는 코드를 제거한다. CommonJS 의 동적 \`require\` 는 그 분석을 막아 번들에 죽은 코드가 남는다.
- import map 사용 시 빌드 산출물 / dev 환경 모두에서 일관성 확인.

## TypeScript 엄격 설정

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
\`\`\`

- \`noUncheckedIndexedAccess\` 권장 — \`arr[0]\` 이 \`T | undefined\` 가 되어 안전.

## DOM 안전 조작

- \`innerHTML\` 사용 금지 (XSS).
  - 근거: \`innerHTML\` 은 입력을 HTML로 파싱. 사용자 데이터에 \`<script>\` / \`onerror\` / \`javascript:\` 가 있으면 즉시 실행 또는 이벤트 핸들러 등록. \`textContent\` 는 문자 그대로 노드 텍스트로 삽입 — 파싱 안 함.
- 동적 콘텐츠는 \`textContent\` 또는 \`createElement\` + \`appendChild\`.
- 사용자 입력은 렌더 전 escape 또는 텍스트 노드로.
- \`document.write\` 절대 금지.
  - 근거: 페이지 로드 완료 후 호출하면 문서 전체를 덮어쓴다. 비동기 컨텍스트(이벤트 핸들러, setTimeout)에서 호출 시 빈 페이지로 만든다.

## 쿼리 / 이벤트

- \`document.querySelector\` / \`querySelectorAll\`.
- 이벤트 위임 활용 — 컨테이너 한 곳에 listener, \`event.target.closest()\` 로 분기.
- \`addEventListener\` 해제 (\`{ once: true }\` 또는 명시적 \`removeEventListener\`).

## 상태 / 반응성

- 단순 페이지면 closure로 충분.
- 여러 위젯 간 공유는 \`EventTarget\` 또는 작은 pub-sub:
  \`\`\`ts
  class Store<T> extends EventTarget {
    constructor(private state: T) { super(); }
    get() { return this.state; }
    set(next: T) { this.state = next; this.dispatchEvent(new Event('change')); }
  }
  \`\`\`
- 복잡해지면 \`nanostores\` 또는 작은 reactive 라이브러리 검토.

## 컴포넌트 — Web Components (Custom Elements)

재사용 가능한 위젯이라면 표준 API 권장:

\`\`\`ts
class CounterButton extends HTMLElement {
  private count = 0;
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
    this.addEventListener('click', () => this.update());
  }
  private update() {
    this.count += 1;
    this.render();
  }
  private render() {
    this.shadowRoot!.innerHTML = \`<button>\${this.count}</button>\`;
  }
}
customElements.define('counter-button', CounterButton);
\`\`\`

- 태그 이름은 반드시 하이픈 포함 (\`x-button\` 등).
  - 근거: HTML 명세가 커스텀 엘리먼트에 하이픈을 요구한다. 없으면 브라우저가 등록을 거부해 그냥 알 수 없는 태그로 남는다.
- Shadow DOM으로 스타일 격리 권장.
- \`innerHTML\` Shadow DOM 안이라도 입력 escape는 필수.
  - 근거: Shadow DOM 은 스타일과 DOM 을 캡슐화할 뿐 스크립트 실행을 막지 않는다. 그 안에서 실행된 스크립트도 같은 문서의 쿠키와 전역에 접근한다.

## 라우팅 (SPA가 필요할 때)

- 직접 구현은 권장 X — 라우팅이 필요하면 프레임워크 도입 신호.
- 어쩔 수 없으면 \`history.pushState\` + \`popstate\` 리스너 최소 패턴.

## 비동기

- \`fetch\` + \`async/await\`. \`XMLHttpRequest\` 금지.
  - 근거: \`XMLHttpRequest\` 는 콜백 기반이라 에러 처리와 취소가 흩어진다. \`fetch\` + \`AbortController\` 가 같은 일을 표준적으로 처리한다.
- 항상 \`signal: AbortController.signal\` — 컴포넌트 unmount / 페이지 이탈 시 cancel.
- 에러는 \`response.ok\` 확인. \`fetch\` 는 4xx/5xx에서 reject 하지 않음.

## 모듈 구조

\`\`\`
src/
├ main.ts                  진입점
├ components/              Web Components 또는 위젯 팩토리
├ utils/                   순수 함수
└ types/
\`\`\`

- 한 파일 200줄 넘으면 분리 검토.
- 전역 import 부수효과 의존 금지 — 명시적 \`init()\` 호출.
  - 근거: import 순서만 바꿔도 동작이 달라진다. 번들러가 순서를 재배치하면 개발에서는 되던 것이 빌드에서 깨진다.

## 폴리필 / 브라우저 호환

- 지원 브라우저 명시: \`browserslist\` in \`package.json\`.
- 자동 폴리필: \`@vitejs/plugin-legacy\` (필요할 때).

## 보안

- 사용자 입력 → 렌더 시 escape.
- 외부 스크립트 \`<script src="...">\` 는 SRI(integrity hash) 권장.
- CSP 헤더 (서버에서 설정).

## 언제 프레임워크로 갈아탈 시점인가

| 신호 | 의미 |
|------|------|
| 상태 동기화 코드가 비즈니스 로직보다 많아짐 | 프레임워크 도입 |
| 컴포넌트가 5개 이상이며 props 전달이 깊어짐 | 컴포넌트 트리 추상화 필요 |
| 라우팅이 필요해짐 | SPA 프레임워크 |
| 서버 렌더링이 필요해짐 | 메타프레임워크 (Next / Nuxt / SvelteKit) |
| 팀 합류 인원이 늘어남 | 표준 프레임워크가 학습 비용 절감 |

## AI 행동 규칙

- \`innerHTML\` 사용 시도 발견 시 \`textContent\` 또는 안전한 노드 생성으로 교체.
- \`var\` / \`function\` 함수 선언 / \`==\` (느슨한 비교) 발견 시 \`const\`/\`let\` / \`=>\` / \`===\` 로 교체.
- 컴포넌트 트리 / 라우팅 / 상태 동기화 코드가 100줄 넘기 시작 시 프레임워크 도입 검토 권고.
- DOM 쿼리 결과는 \`null\` 가능성 — narrowing 필수.
  - 근거: 선택자가 안 맞거나 요소가 아직 없으면 null 이 온다. 확인 없이 쓰면 그 시점부터 스크립트 전체가 멈춘다.

## 패턴 (DO / DON'T)

### XSS 방지

\`\`\`ts
// DON'T
container.innerHTML = '<p>' + userInput + '</p>';

// DO
const p = document.createElement('p');
p.textContent = userInput;
container.appendChild(p);
\`\`\`

### DOM null 안전

\`\`\`ts
// DON'T
const btn = document.querySelector('#save');
btn.addEventListener('click', save);   // btn은 Element | null

// DO
const btn = document.querySelector<HTMLButtonElement>('#save');
if (!btn) throw new Error('save button missing');
btn.addEventListener('click', save);
\`\`\`

### fetch 안전

\`\`\`ts
async function loadUser(id: string, signal: AbortSignal): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`, { signal });
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`innerHTML\` 동적 콘텐츠 | \`textContent\` / createElement |
| \`var\` / \`==\` / function declaration | \`const\`/\`let\` / \`===\` / arrow |
| 전역 폴리믹스 (window.X 직접 할당) | 모듈 export |
| 무한 SPA 자체 구현 | 프레임워크 도입 |
| webpack 신규 셋업 | Vite |

## 적용 범위와 경계

이 문서는 **프레임워크 없이 표준 DOM API + TypeScript 로 작성하는 경우**만 다룬다. 작은 위젯·embed 스크립트·정적 사이트 인터랙션이 대상이다.

여기서 다루지 않는 것 → 컴포넌트 트리·상태 동기화·라우팅을 본격적으로 다뤄야 한다면 이 문서의 범위가 아니다. 위 「언제 프레임워크로 갈아탈 시점인가」의 신호가 보이면 직접 구현하지 말고 유저에게 프레임워크 도입을 제안한다.

클래스·토큰은 \`styling.md\`, 접근성은 \`a11y.md\`, 보안 일반은 \`security.md\` 를 함께 따른다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **XSS 방어 vs 코드 간결함** — 방어가 이긴다. \`innerHTML\` 한 줄이 짧다는 이유로 쓰지 않는다.
- **표준 API vs 라이브러리 추가** — 표준이 이긴다. 표준으로 안 되는 지점에 도달하면 라이브러리가 아니라 프레임워크 전환을 검토한다.
- **자체 구현 vs 프레임워크 전환** — 전환 신호가 보이면 전환이 이긴다. 자체 상태 관리·라우터·템플릿 엔진을 새로 만들지 마라.
- **브라우저 호환 vs 최신 문법** — 지원 대상이 명시돼 있으면 그쪽이 이긴다. 명시돼 있지 않으면 유저에게 묻는다.

## 자가 점검

코드를 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] \`innerHTML\` 로 사용자 입력을 넣지 않았다 — \`textContent\` 나 \`createElement\` 를 썼다
- [ ] \`document.write\` 를 쓰지 않았다
- [ ] \`querySelector\` 결과의 \`null\` 을 처리했다
- [ ] 추가한 \`addEventListener\` 마다 해제 경로나 \`{ once: true }\` 가 있다
- [ ] 목록 항목마다 리스너를 붙이지 않고 이벤트 위임을 썼다
- [ ] \`fetch\` + \`async/await\` 를 썼다 — \`XMLHttpRequest\` 가 없다
- [ ] Custom Element 태그 이름에 하이픈이 있다
- [ ] 자체 프레임워크를 만들고 있지 않다 — 그 신호가 보이면 유저에게 알렸다
`;
