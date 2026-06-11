import type { FrontendFramework } from './framework';

export const STATE_MANAGER_LIST = [
  'redux-toolkit',
  'zustand',
  'jotai',
  'recoil',
  'mobx',
  'pinia',
  'vuex',
  'svelte-stores',
] as const;
export type StateManager = (typeof STATE_MANAGER_LIST)[number];

export const STATE_MANAGER_LABELS: Readonly<Record<StateManager, string>> = {
  'redux-toolkit': 'Redux Toolkit',
  zustand: 'Zustand',
  jotai: 'Jotai',
  recoil: 'Recoil',
  mobx: 'MobX',
  pinia: 'Pinia',
  vuex: 'Vuex',
  'svelte-stores': 'Svelte Stores',
};

export const STATE_MANAGERS_BY_FRAMEWORK: Readonly<Record<FrontendFramework, readonly StateManager[]>> = {
  react: ['redux-toolkit', 'zustand', 'jotai', 'recoil', 'mobx'],
  next: ['redux-toolkit', 'zustand', 'jotai', 'recoil'],
  vue: ['pinia', 'vuex'],
  nuxt: ['pinia'],
  svelte: ['svelte-stores'],
  sveltekit: ['svelte-stores'],
  solid: [],
  vanilla: [],
};

export const isStateManager = (value: string): value is StateManager =>
  (STATE_MANAGER_LIST as readonly string[]).includes(value);
