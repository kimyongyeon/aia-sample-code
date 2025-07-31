const HistoryStateManager = (() => {
  let stack = [];
  let lockMessage = null;
  let layerChangeCallback = () => {};
  let popStateCallback = () => {};

  const _onPopState = (e) => {
    const state = e.state || {};
    if (lockMessage) {
      const proceed = confirm(lockMessage);
      if (!proceed) {
        rePush();
        return;
      }
      lockMessage = null;
    }

    stack = state.stack || [];
    layerChangeCallback(stack);

    // popState 콜백 호출
    popStateCallback(state);
  };

  const rePush = () => {
    history.pushState({ stack }, "", location.pathname + location.search);
  };

  return {
    init() {
      window.addEventListener("popstate", _onPopState);
      history.replaceState({ stack }, "", location.pathname);
    },

    // 기존 메서드들
    pushLayer(name, data = {}) {
      stack.push({ name, data });
      history.pushState({ stack }, "", location.pathname);
      layerChangeCallback(stack);
    },

    popLayer() {
      stack.pop();
      history.back(); // popState 발생
    },

    onLayerChange(cb) {
      layerChangeCallback = cb;
    },

    getCurrentLayer() {
      return stack[stack.length - 1];
    },

    lockNavigation(msg = "정말 나가시겠습니까?") {
      lockMessage = msg;
    },

    unlockNavigation() {
      lockMessage = null;
    },

    isLocked() {
      return !!lockMessage;
    },

    rePush,

    restoreFromURL() {
      const params = new URLSearchParams(location.search);
      const modal = params.get("modal");
      if (modal) this.pushLayer(modal);
    },

    destroy() {
      window.removeEventListener("popstate", _onPopState);
      stack = [];
    },

    // index.html에서 사용하는 메서드들 추가
    replaceState(state) {
      history.replaceState(state, "", location.pathname);
    },

    pushState(state) {
      history.pushState(state, "", location.pathname);
    },

    onPopState(callback) {
      popStateCallback = callback;
    },
  };
})();
