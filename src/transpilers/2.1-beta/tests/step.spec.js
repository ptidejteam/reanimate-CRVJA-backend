import { translate } from './helpers/translate.js';

// STEP: the amount added to a For counter on each pass (1 by default).
// https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['a positive step', 'For I=1 To 10 Step 3\nNext I', 'for (I = 1; I <= 10; I += 3) {'],
  ['a negative step', 'For I=10 To 1 Step -2\nNext I', 'for (I = 10; I >= 1; I += -2) {'],
  ['a decimal step', 'For X#=0 To 1 Step 0.25\nNext X#', 'for (X_f = 0; X_f <= 1; X_f += 0.25) {'],
  [
    'a variable step',
    'For I=1 To 10 Step S\nNext I',
    'for (I = 1; S >= 0 ? I <= 10 : I >= 10; I += S) {',
  ],
  ['no step', 'For I=1 To 3\nNext I', 'for (I = 1; I <= 3; I++) {'],
  // An integer counter adds the Step, then truncates toward zero; checked on creepycat:
  // For I=-3 To 0 Step 1.5 gives -3, -1, 0, and Step 0.5 from 1 never moves.
  [
    'a fractional step on an integer counter',
    'For I=-3 To 0 Step 1.5\nNext I',
    'for (I = -3; I <= 0; I = Math.trunc(I + 1.5)) {',
  ],
  [
    'a fractional step on a float counter',
    'For X#=1 To 3 Step 0.5\nNext X#',
    'for (X_f = 1; X_f <= 3; X_f += 0.5) {',
  ],
])('For translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
