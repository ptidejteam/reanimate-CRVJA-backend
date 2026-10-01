import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AMOSListener from './grammar/generated/AMOSListener.js';
import ScopeHandler from './handlers/scope-handler.js';
import ExpressionHandler from './handlers/expression-handler.js';
import ScreenHandler from './handlers/screen-handler.js';
import DrawingHandler from './handlers/drawing-handler.js';
import ControlFlowHandler from './handlers/control-flow-handler.js';
import SoundHandler from './handlers/sound-handler.js';
import DataHandler from './handlers/data-handler.js';
import { amiga12BitToHex, amiga12BitToRgb, validateAmigaColor } from '../../utils/amiga-color.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeScript = fs.readFileSync(path.join(__dirname, 'runtime', 'amos-runtime.js'), 'utf8');

class AmosTranslator extends AMOSListener {
  constructor() {
    super();

    // Initialize state
    this.imports = '';
    this.output = '';
    this.id = 0;
    this.colorMapping = {
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
    this.palette = `const colorMapping = ${JSON.stringify(this.colorMapping, null, 2)};\n`;
    this.lineData = [];
    this.globalVariables = '';
    this.functionDeclarationSupport = '';
    this.scopes = [{}];
    this.globalVariablesSet = new Set();
    this.hasDataMatrix = false;
    const colorRuntime = [validateAmigaColor, amiga12BitToRgb, amiga12BitToHex]
      .map((helper) => helper.toString())
      .join('\n');
    this.preamble = `\n${colorRuntime}\n${runtimeScript}\n`;

    // Delegate modules
    this.scopeHandler = new ScopeHandler(this);
    this.expressionHandler = new ExpressionHandler(this);
    this.screenHandler = new ScreenHandler(this);
    this.drawingHandler = new DrawingHandler(this);
    this.controlFlowHandler = new ControlFlowHandler(this);
    this.soundHandler = new SoundHandler(this);
    this.dataHandler = new DataHandler(this);
  }

  // ScopeHandler
  enterNewScope() {
    this.scopeHandler.enterNewScope();
  }
  exitCurrentScope() {
    this.scopeHandler.exitCurrentScope();
  }
  get currentScope() {
    return this.scopeHandler.currentScope;
  }
  get isRootScope() {
    return this.scopeHandler.isRootScope;
  }
  isVariableDeclared(name) {
    return this.scopeHandler.isVariableDeclared(name);
  }
  enterGlobal(ctx) {
    this.scopeHandler.enterGlobal(ctx);
  }
  enterVariableAssignment(ctx) {
    this.scopeHandler.enterVariableAssignment(ctx);
  }
  enterAdd(ctx) {
    this.scopeHandler.enterAdd(ctx);
  }
  enterProcedure(ctx) {
    this.scopeHandler.enterProcedure(ctx);
  }
  exitProcedure(ctx) {
    this.scopeHandler.exitProcedure(ctx);
  }
  enterProcedureCall(ctx) {
    this.scopeHandler.enterProcedureCall(ctx);
  }

  // ScreenHandler
  enterScreenOpen(ctx) {
    this.screenHandler.enterScreenOpen(ctx);
  }
  enterCls(ctx) {
    this.screenHandler.enterCls(ctx);
  }
  enterCursOff(ctx) {
    this.screenHandler.enterCursOff(ctx);
  }
  enterCursOn(ctx) {
    this.screenHandler.enterCursOn(ctx);
  }
  enterPalette(ctx) {
    this.screenHandler.enterPalette(ctx);
  }
  enterInk(ctx) {
    this.screenHandler.enterInk(ctx);
  }
  enterPen(ctx) {
    this.screenHandler.enterPen(ctx);
  }
  enterPaper(ctx) {
    this.screenHandler.enterPaper(ctx);
  }

  // DrawingHandler
  enterBar(ctx) {
    this.drawingHandler.enterBar(ctx);
  }
  enterBox(ctx) {
    this.drawingHandler.enterBox(ctx);
  }
  enterCircle(ctx) {
    this.drawingHandler.enterCircle(ctx);
  }
  enterText(ctx) {
    this.drawingHandler.enterText(ctx);
  }
  enterTurboDraw(ctx) {
    this.drawingHandler.enterTurboDraw(ctx);
  }
  enterBlitterFill(ctx) {
    this.drawingHandler.enterBlitterFill(ctx);
  }
  enterBlitterClear(ctx) {
    this.drawingHandler.enterBlitterClear(ctx);
  }
  enterLoadBank(ctx) {
    this.drawingHandler.enterLoadBank(ctx);
  }
  enterSprite(ctx) {
    this.drawingHandler.enterSprite(ctx);
  }

  // ControlFlowHandler
  enterIfStatement(ctx) {
    this.controlFlowHandler.enterIfStatement(ctx);
  }
  exitIfStatement(ctx) {
    this.controlFlowHandler.exitIfStatement(ctx);
  }
  enterElseStatement(ctx) {
    this.controlFlowHandler.enterElseStatement(ctx);
  }
  exitElseStatement(ctx) {
    this.controlFlowHandler.exitElseStatement(ctx);
  }
  enterIfKeyStateStatement(ctx) {
    this.controlFlowHandler.enterIfKeyStateStatement(ctx);
  }
  exitIfKeyStateStatement(ctx) {
    this.controlFlowHandler.exitIfKeyStateStatement(ctx);
  }
  enterForLoop(ctx) {
    this.controlFlowHandler.enterForLoop(ctx);
  }
  exitForLoop(ctx) {
    this.controlFlowHandler.exitForLoop(ctx);
  }
  enterDoLoop(ctx) {
    this.controlFlowHandler.enterDoLoop(ctx);
  }
  exitDoLoop(ctx) {
    this.controlFlowHandler.exitDoLoop(ctx);
  }
  enterWhileWend(ctx) {
    this.controlFlowHandler.enterWhileWend(ctx);
  }
  exitWhileWend(ctx) {
    this.controlFlowHandler.exitWhileWend(ctx);
  }
  enterRepeatUntil(ctx) {
    this.controlFlowHandler.enterRepeatUntil(ctx);
  }
  exitRepeatUntil(ctx) {
    this.controlFlowHandler.exitRepeatUntil(ctx);
  }
  enterWait(ctx) {
    this.controlFlowHandler.enterWait(ctx);
  }

  // SoundHandler
  enterPlaySound(ctx) {
    this.soundHandler.enterPlaySound(ctx);
  }

  // DataHandler
  enterOpenOut(ctx) {
    this.dataHandler.enterOpenOut(ctx);
  }
  enterOpenIn(ctx) {
    this.dataHandler.enterOpenIn(ctx);
  }
  enterInputVariable(ctx) {
    this.dataHandler.enterInputVariable(ctx);
  }
  enterCloseFile(ctx) {
    this.dataHandler.enterCloseFile(ctx);
  }
  enterPrintStatement(ctx) {
    this.dataHandler.enterPrintStatement(ctx);
  }
  enterDataStatement(ctx) {
    this.dataHandler.enterDataStatement(ctx);
  }
  enterReadStatement(ctx) {
    this.dataHandler.enterReadStatement(ctx);
  }
  enterArrayDeclaration(ctx) {
    this.dataHandler.enterArrayDeclaration(ctx);
  }
  enterArrayAssignment(ctx) {
    this.dataHandler.enterArrayAssignment(ctx);
  }

  // ExpressionHandler
  handleExpression(expressionContext) {
    return this.expressionHandler.handleExpression(expressionContext);
  }

  getJavaScript() {
    let result =
      '// Using Version 2.0.0 of the AMOS to JavaScript Transpiler\n' +
      this.imports +
      this.palette +
      this.globalVariables +
      this.functionDeclarationSupport +
      this.preamble +
      this.output;

    // console.log(result);
    return result;
  }
}

export default AmosTranslator;
