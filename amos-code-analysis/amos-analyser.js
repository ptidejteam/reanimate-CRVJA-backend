import AMOSListener from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSListener.js';

class AMOSAnalyser extends AMOSListener {
  constructor(summaryTable) {
    super();
    this.screenOpenCount = 0;
    this.summaryTable = summaryTable;
  }

  enterScreen_open() {
    this.screenOpenCount++;
    console.log(this.screenOpenCount);
    
    this.summaryTable.forEach(element => {
      if (element.COMMAND === "SCREEN OPEN") {
        element.COUNT++;
      }
    });
  }
} 

export default AMOSAnalyser;