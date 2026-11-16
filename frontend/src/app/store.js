/**
 * Store observable mínimo. El estado global se limita a sesión, tema y mascota
 * activa. El estado de pantalla vive en cada página.
 */
export function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    get() {
      return state;
    },
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      for (const listener of listeners) {
        listener(state);
      }
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const appStore = createStore({
  session: null,
  theme: 'light',
  activePet: null,
});
