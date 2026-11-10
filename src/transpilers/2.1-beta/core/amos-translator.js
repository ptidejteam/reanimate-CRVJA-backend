import AMOSListener from '../grammar/generated/AMOSListener.js';

/** Connects the AMOS tree walker to handlers and accepted extension statements. */
export default class AMOSTranslator extends AMOSListener {
  constructor(context, dispatcher) {
    super();
    this.context = context;
    this.dispatcher = dispatcher;
  }

  enterEveryRule(ctx) {
    const handler = this.dispatcher.get('enter', ctx);
    if (handler) handler(ctx);
  }

  exitEveryRule(ctx) {
    const handler = this.dispatcher.get('exit', ctx);
    if (handler) handler(ctx);
  }

  enterExtensionStatement(ctx) {
    const { extension, node } = ctx.EXTENSION_STATEMENT().symbol.extensionStatement;
    this.context.includeExtensionRuntime(extension);
    // Translation runs here, after the walker has entered the correct scope.
    const result = extension.translate(node, this.context);
    if (result && typeof result.then === 'function') {
      throw new Error('Extension translate() must be synchronous');
    }
  }
}
