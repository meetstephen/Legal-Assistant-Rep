// Only the latest request owns callbacks and completion state.
export function createAiRunLifecycle() {
  let active = null;
  const cancel = () => {
    const previous = active;
    active = null;
    previous?.controller.abort();
  };
  return {
    cancel,
    start() {
      cancel();
      const controller = new AbortController();
      const request = {
        controller,
        isCurrent: () => active === request && !controller.signal.aborted,
        finish: () => { if (active === request) active = null; },
      };
      active = request;
      return request;
    },
  };
}

