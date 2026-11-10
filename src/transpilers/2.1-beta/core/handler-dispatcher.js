/** Imported grammars have their own context classes and rule indexes. */
export function getRuleName(node) {
  return node?.parser?.ruleNames[node.ruleIndex];
}

/** Resolves listener-event handlers and expression translators by grammar rule. */
export default class HandlerDispatcher {
  constructor(handlers = []) {
    this.handlers = { enter: new Map(), exit: new Map(), expression: new Map() };
    this.registerHandlers(handlers);
  }

  registerHandlers(handlers) {
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
        const match = /^(enter|exit|translate)([A-Z]\w*)$/.exec(name);
        if (!match || typeof handler[name] !== 'function') continue;
        const [, prefix, suffix] = match;
        const phase = prefix === 'translate' ? 'expression' : prefix;
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

  getExpressionHandler(node) {
    return this.get('expression', node);
  }
}
