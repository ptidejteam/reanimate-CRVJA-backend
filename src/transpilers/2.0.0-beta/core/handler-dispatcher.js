/** Imported grammars have their own context classes and rule indexes. */
export function getRuleName(node) {
  return node?.parser?.ruleNames[node.ruleIndex];
}

/** Resolves the existing enterX/exitX/visitX convention without a coordinator. */
export default class HandlerDispatcher {
  constructor(handlers = []) {
    this.handlers = { enter: new Map(), exit: new Map(), visit: new Map() };
    this.register(handlers);
  }

  register(handlers) {
    for (const handler of handlers) {
      // Include inherited methods, with normal JavaScript overriding within a handler.
      const methodNames = new Set();
      for (
        let prototype = handler;
        prototype && prototype !== Object.prototype;
        prototype = Object.getPrototypeOf(prototype)
      ) {
        for (const name of Object.getOwnPropertyNames(prototype)) methodNames.add(name);
      }

      for (const name of methodNames) {
        const match = /^(enter|exit|visit)([A-Z]\w*)$/.exec(name);
        if (!match || typeof handler[name] !== 'function') continue;
        const [, phase, suffix] = match;
        const rule = suffix[0].toLowerCase() + suffix.slice(1);
        const phaseHandlers = this.handlers[phase];
        if (phaseHandlers.has(rule)) {
          throw new Error(`Duplicate ${phase} handler for rule "${rule}"`);
        }
        phaseHandlers.set(rule, handler[name].bind(handler));
      }
    }
  }

  get(phase, node) {
    return this.handlers[phase].get(getRuleName(node));
  }
}
