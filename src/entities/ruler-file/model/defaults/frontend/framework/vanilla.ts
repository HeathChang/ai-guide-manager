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
- ES Modules 표준. CommonJS 신규 작성 금지.
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
- 동적 콘텐츠는 \`textContent\` 또는 \`createElement\` + \`appendChild\`.
- 사용자 입력은 렌더 전 escape 또는 텍스트 노드로.
- \`document.write\` 절대 금지.

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
- Shadow DOM으로 스타일 격리 권장.
- \`innerHTML\` Shadow DOM 안이라도 입력 escape는 필수.

## 라우팅 (SPA가 필요할 때)

- 직접 구현은 권장 X — 라우팅이 필요하면 프레임워크 도입 신호.
- 어쩔 수 없으면 \`history.pushState\` + \`popstate\` 리스너 최소 패턴.

## 비동기

- \`fetch\` + \`async/await\`. \`XMLHttpRequest\` 금지.
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
`;
