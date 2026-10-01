import AMOSListener from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSListener.js';
import AMOSLexer from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSLexer.js';

class AMOSAnalyser extends AMOSListener {
  constructor(summaryTable) {
    super();
    this.screenOpenCount = 0;
    this.summaryTable = summaryTable.filter(row => row.CATEGORY === 'Instruction');
    this.rowsByCommand = new Map();

    for (const row of this.summaryTable) {
      const command = row.COMMAND.trim().toUpperCase();
      if (!this.rowsByCommand.has(command)) {
        this.rowsByCommand.set(command, []);
      }
      this.rowsByCommand.get(command).push(row);
    }
  }

  visitTerminal(node) {
    const type = node.symbol.type;
    const literal = AMOSLexer.literalNames[type];
    if (!AMOSLexer.symbolicNames[type] || !literal) {
      return;
    }
    this.enterCommand(literal.slice(1, -1));
  }

  enterCommand(command) {
    const rows = this.rowsByCommand.get(command.trim().toUpperCase());
    if (!rows) {
      return;
    }
    for (const row of rows) {
      row.COUNT++;
    }
  }

}

export default AMOSAnalyser;
