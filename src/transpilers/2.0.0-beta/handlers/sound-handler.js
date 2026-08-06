export default class SoundHandler {
  constructor(translator) {
    this.translator = translator;
  }

  enterPlay_sound(ctx) {
    const soundIndex = ctx.children[1]?.getText();
    const duration = ctx.children[3]?.getText();

    this.translator.output += `soundPlayer(${soundIndex}, ${duration} * 1000);`;
  }
}
