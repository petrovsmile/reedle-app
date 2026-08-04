const noop = () => {};
const asyncNoop = async () => {};

const proxy = new Proxy(noop, {
  get(target, property) {
    if (property === '__esModule') return true;
    if (property === 'default') return proxy;
    if (property === 'runOnJS' || property === 'runOnUI' || property === 'createWorkletRuntime') {
      return fn => fn;
    }
    if (property === 'executeOnUIRuntimeSync') {
      return fn => fn();
    }
    if (property === 'scheduleOnUI' || property === 'scheduleOnRN') {
      return (_fn, ..._args) => {};
    }
    if (property === 'makeShareableCloneRecursive' || property === 'makeShareable' || property === 'makeShareableCloneOnUIRecursive') {
      return value => value;
    }
    if (property === 'isWorkletFunction') return () => false;
    if (property === 'WorkletsModule') return { installTurboModule: noop };
    if (property === 'NativeWorklets') return {};
    if (property === 'callMicrotasks') return asyncNoop;
    return noop;
  },
  apply() {},
});

module.exports = proxy;
