export default class SoundHandler {
  constructor(translator) {
    this.translator = translator;
  }

  enterPlaySound(ctx) {
    const soundIndex = ctx.expression()
      ? this.translator.handleExpression(ctx.expression())
      : ctx.children[1]?.getText();
    const duration = ctx.children[3]?.getText();

    this.translator.output += `soundPlayer(${soundIndex}, ${duration} * 1000);`;
  }
}
