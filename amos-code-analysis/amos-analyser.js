import AMOSListener from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSListener.js';

class AMOSAnalyser extends AMOSListener {
  constructor() {
    super();
    this.screenOpenCount = 0;
  }

  enterScreen_open(ctx) {
    this.screenOpenCount++;
    console.log(this.screenOpenCount);
  }
} 

export default AMOSAnalyser;