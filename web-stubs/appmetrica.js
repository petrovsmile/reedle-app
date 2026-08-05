const AppMetrica = {
  activate() {},
  reportEvent(name, params = {}) {
    if (typeof window === 'undefined' || typeof window.ym !== 'function') return;

    window.ym(87111225, 'reachGoal', 'PWA_' + name, params);
  },
};

export default AppMetrica;
