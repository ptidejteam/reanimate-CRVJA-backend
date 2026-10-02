import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AMOSListener from './grammar/generated/AMOSListener.js';
import ExpressionVisitor from './expression-visitor.js';
import Instructions from './commands/instructions.js';
import Structures from './commands/structures.js';
import Functions from './commands/functions.js';
import Amcaf from './commands/amcaf.js';
import { amiga12BitToHex, amiga12BitToRgb, validateAmigaColor } from '../../utils/amiga-color.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeScript = fs.readFileSync(path.join(__dirname, 'runtime', 'amos-runtime.js'), 'utf8');

// AMOS colour indexes used until the program sets its own Palette
const DEFAULT_COLOR_MAPPING = {
  0: 'rgb(0,0,0)',
  1: 'rgb(255,255,255)',
  2: 'rgb(255,0,0)',
  3: 'rgb(0,255,0)',
  4: 'rgb(0,0,255)',
  5: 'rgb(255,255,0)',
  6: 'rgb(0,255,255)',
  7: 'rgb(255,0,255)',
  8: 'rgb(192,192,192)',
  9: 'rgb(128,128,128)',
  10: 'rgb(128,0,0)',
  11: 'rgb(128,128,0)',
  12: 'rgb(0,128,0)',
  13: 'rgb(128,0,128)',
  14: 'rgb(0,128,128)',
  15: 'rgb(0,0,128)',
};

/**
 * Walks the AMOS parse tree and builds the JavaScript program.
 *
 * ANTLR calls enterX(ctx) / exitX(ctx) for every grammar rule X. Each AMOS
 * command has a forwarder at the bottom of this class that calls the method
 * with the same name in its category file (commands/), where the actual
 * translation lives. See README.md for how to add or change a command.
 */
class AmosTranslator extends AMOSListener {
  constructor() {
    super();

    // Sections of the generated program, joined in this order by getJavaScript()
    this.colorMapping = { ...DEFAULT_COLOR_MAPPING };
    this.palette = `const colorMapping = ${JSON.stringify(this.colorMapping, null, 2)};\n`;
    this.globalVariables = '';
    this.functionDeclarationSupport = '';
    const colorRuntime = [validateAmigaColor, amiga12BitToRgb, amiga12BitToHex]
      .map((helper) => helper.toString())
      .join('\n');
    this.preamble = `\n${colorRuntime}\n${runtimeScript}\n`;
    this.output = '';

    // Translation state
    this.scopes = [{}]; // [main program, Procedure being translated]
    this.globalVariablesSet = new Set(); // names listed in a `Global` statement
    this.hasDataMatrix = false;
    this.expressionVisitor = new ExpressionVisitor(this);

    // One object per command category (see commands/)
    this.instructions = new Instructions(this);
    this.structures = new Structures(this);
    this.functions = new Functions(this);
    this.amcaf = new Amcaf(this);
  }

  // ---- Helpers used by the command files -----------------------------------

  handleExpression(expressionContext) {
    if (!expressionContext) return '';
    return this.expressionVisitor.visit(expressionContext);
  }

  /** AMOS default value of a new variable: "" for strings (NAME$), 0 otherwise. */
  defaultValueFor(name) {
    return name.endsWith('$') ? '""' : 0;
  }

  /** The innermost scope: the main program, or the Procedure being translated. */
  get currentScope() {
    return this.scopes[this.scopes.length - 1];
  }

  get isRootScope() {
    return this.scopes.length === 1;
  }

  isVariableDeclared(name) {
    const isLocal = this.currentScope[name] !== undefined;
    const isGlobal = this.globalVariablesSet.has(name);

    return isLocal || isGlobal;
  }

  /** Emits `let name = <default>;` the first time an AMOS variable is seen. */
  declareVariable(name) {
    if (this.isVariableDeclared(name)) return;

    const defaultValue = this.defaultValueFor(name);
    const declaration = `let ${name} = ${defaultValue};\n`;
    if (this.isRootScope) {
      this.globalVariables += declaration;
    } else {
      this.output += declaration;
    }
    this.currentScope[name] = defaultValue;
  }

  getJavaScript() {
    return (
      '// Using Version 2.0.0 of the AMOS to JavaScript Transpiler\n' +
      this.palette +
      this.globalVariables +
      this.functionDeclarationSupport +
      this.preamble +
      this.output
    );
  }

  // ==========================================================================
  // AMOS commands
  // One forwarder per grammar rule, grouped by command category and sorted A-Z
  // by AMOS name (same order as amos.g4 and the files in commands/).
  // Functions (Sin, Rnd, ...) are forwarded from expression-visitor.js instead.
  // ==========================================================================

  // ---- Instructions (commands/instructions.js) -----------------------------

  // ADD
  enterAdd(ctx) {
    this.instructions.enterAdd(ctx);
  }

  // BAR
  enterBar(ctx) {
    this.instructions.enterBar(ctx);
  }

  // BOX
  enterBox(ctx) {
    this.instructions.enterBox(ctx);
  }

  // CIRCLE
  enterCircle(ctx) {
    this.instructions.enterCircle(ctx);
  }

  // CLOSE
  enterCloseFile(ctx) {
    this.instructions.enterCloseFile(ctx);
  }

  // CLS
  enterCls(ctx) {
    this.instructions.enterCls(ctx);
  }

  // CURS OFF
  enterCursOff(ctx) {
    this.instructions.enterCursOff(ctx);
  }

  // CURS ON
  enterCursOn(ctx) {
    this.instructions.enterCursOn(ctx);
  }

  // DIM
  enterArrayDeclaration(ctx) {
    this.instructions.enterArrayDeclaration(ctx);
  }

  // INK
  enterInk(ctx) {
    this.instructions.enterInk(ctx);
  }

  // LOAD
  enterLoadBank(ctx) {
    this.instructions.enterLoadBank(ctx);
  }

  // OPEN IN
  enterOpenIn(ctx) {
    this.instructions.enterOpenIn(ctx);
  }

  // OPEN OUT
  enterOpenOut(ctx) {
    this.instructions.enterOpenOut(ctx);
  }

  // PALETTE
  enterPalette(ctx) {
    this.instructions.enterPalette(ctx);
  }

  // PAPER
  enterPaper(ctx) {
    this.instructions.enterPaper(ctx);
  }

  // PEN
  enterPen(ctx) {
    this.instructions.enterPen(ctx);
  }

  // PLAY
  enterPlaySound(ctx) {
    this.instructions.enterPlaySound(ctx);
  }

  // PRINT (and PRINT #)
  enterPrintStatement(ctx) {
    this.instructions.enterPrintStatement(ctx);
  }

  // SCREEN OPEN
  enterScreenOpen(ctx) {
    this.instructions.enterScreenOpen(ctx);
  }

  // SPRITE
  enterSprite(ctx) {
    this.instructions.enterSprite(ctx);
  }

  // TEXT
  enterText(ctx) {
    this.instructions.enterText(ctx);
  }

  // WAIT
  enterWait(ctx) {
    this.instructions.enterWait(ctx);
  }

  // ---- Structures (commands/structures.js) ---------------------------------

  // DATA
  enterDataStatement(ctx) {
    this.structures.enterDataStatement(ctx);
  }

  // DO ... LOOP
  enterDoLoop(ctx) {
    this.structures.enterDoLoop(ctx);
  }

  exitDoLoop(ctx) {
    this.structures.exitDoLoop(ctx);
  }

  // ELSE
  enterElseStatement(ctx) {
    this.structures.enterElseStatement(ctx);
  }

  exitElseStatement(ctx) {
    this.structures.exitElseStatement(ctx);
  }

  // FOR ... NEXT
  enterForLoop(ctx) {
    this.structures.enterForLoop(ctx);
  }

  exitForLoop(ctx) {
    this.structures.exitForLoop(ctx);
  }

  // GLOBAL
  enterGlobal(ctx) {
    this.structures.enterGlobal(ctx);
  }

  // IF ... END IF
  enterIfStatement(ctx) {
    this.structures.enterIfStatement(ctx);
  }

  exitIfStatement(ctx) {
    this.structures.exitIfStatement(ctx);
  }

  // IF KEY STATE(...) ... END IF
  enterIfKeyStateStatement(ctx) {
    this.structures.enterIfKeyStateStatement(ctx);
  }

  exitIfKeyStateStatement(ctx) {
    this.structures.exitIfKeyStateStatement(ctx);
  }

  // INPUT #
  enterInputVariable(ctx) {
    this.structures.enterInputVariable(ctx);
  }

  // PROC (procedure call)
  enterProcedureCall(ctx) {
    this.structures.enterProcedureCall(ctx);
  }

  // PROCEDURE ... END PROC
  enterProcedure(ctx) {
    this.structures.enterProcedure(ctx);
  }

  exitProcedure(ctx) {
    this.structures.exitProcedure(ctx);
  }

  // READ
  enterReadStatement(ctx) {
    this.structures.enterReadStatement(ctx);
  }

  // REPEAT ... UNTIL
  enterRepeatUntil(ctx) {
    this.structures.enterRepeatUntil(ctx);
  }

  exitRepeatUntil(ctx) {
    this.structures.exitRepeatUntil(ctx);
  }

  // WHILE ... WEND
  enterWhileWend(ctx) {
    this.structures.enterWhileWend(ctx);
  }

  exitWhileWend(ctx) {
    this.structures.exitWhileWend(ctx);
  }

  // Not in the command index: language syntax without a category.

  // Array assignment: A(1) = 2
  enterArrayAssignment(ctx) {
    this.structures.enterArrayAssignment(ctx);
  }

  // Variable assignment: X = 1
  enterVariableAssignment(ctx) {
    this.structures.enterVariableAssignment(ctx);
  }

  // ---- AMCAF extension (commands/amcaf.js) ---------------------------------

  // BLITTER CLEAR
  enterBlitterClear(ctx) {
    this.amcaf.enterBlitterClear(ctx);
  }

  // BLITTER FILL
  enterBlitterFill(ctx) {
    this.amcaf.enterBlitterFill(ctx);
  }

  // TURBO DRAW
  enterTurboDraw(ctx) {
    this.amcaf.enterTurboDraw(ctx);
  }
}

export default AmosTranslator;
