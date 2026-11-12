import { translate } from './helpers/translate.js';

// DEF FN: defines a function of one line, called with Fn. https://amospromanual.dev/05-01-the-bare-bones.html

test.each([
  ['one parameter', 'Def Fn A(X)=X*2', 'A = (X) => X * 2;'],
  ['two parameters', 'Def Fn S(A,B)=A+B', 'S = (A, B) => A + B;'],
])('Def Fn translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
