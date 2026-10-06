import AMOSListener from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSListener.js';
import AMOSLexer from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSLexer.js';

// Counts catalogued instruction tokens as the parser's tree is walked.
class AMOSAnalyser extends AMOSListener {
  constructor(summaryTable) {
    super();
    this.summaryTable = summaryTable.filter(row => row.CATEGORY === 'Instruction');
    this.rowsByCommand = new Map();

    // Keep every matching catalog row so duplicate command entries share the count.
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
    // ANTLR literal names include surrounding quotes; the catalog names do not.
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
