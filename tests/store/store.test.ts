import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeStore } from '@/src/store/store';
import { logout } from '@/src/store/slices/authSlice';
import { setTheme, toggleSidebar } from '@/src/store/slices/uiSlice';

describe('Redux store lifecycle', () => {
  it('creates an isolated store for every provider/request boundary', () => {
    const firstStore = makeStore();
    const secondStore = makeStore();

    firstStore.dispatch(logout());
    firstStore.dispatch(setTheme('dark'));

    assert.equal(firstStore.getState().auth.isAuthenticated, false);
    assert.equal(firstStore.getState().ui.theme, 'dark');
    assert.equal(secondStore.getState().auth.isAuthenticated, true);
    assert.equal(secondStore.getState().ui.theme, 'light');
  });

  it('keeps reducers deterministic when browser storage is unavailable', () => {
    const store = makeStore();

    assert.doesNotThrow(() => {
      store.dispatch(setTheme('dark'));
      store.dispatch(toggleSidebar());
      store.dispatch(logout());
    });

    const state = store.getState();
    assert.equal(state.ui.theme, 'dark');
    assert.equal(state.ui.sidebarCollapsed, true);
    assert.equal(state.auth.accessToken, null);
  });
});
