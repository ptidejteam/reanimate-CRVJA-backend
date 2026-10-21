import AMCAFListener from './generated/AMCAFListener.js';

class AMCAFTranslator extends AMCAFListener {
  constructor() {
    super();
  }

  enterAmcaf(ctx) {
    console.log('You are using AMCAF extension!');
    console.log('Your parameter is: ' + ctx.expression(0).getText());
  }
}

export default AMCAFTranslator;
