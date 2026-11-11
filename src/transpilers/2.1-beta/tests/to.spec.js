import { translate } from './helpers/translate.js';

// TO: the last value of a For counter. https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['counting up', 'For I=1 To 10\nNext I', 'for (I = 1; I <= 10; I++) {'],
  ['counting down', 'For I=10 To 1 Step -2\nNext I', 'for (I = 10; I >= 1; I += -2) {'],
])('To translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
