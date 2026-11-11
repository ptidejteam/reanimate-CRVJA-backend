import { translate } from './helpers/translate.js';

// DEGREE: angles are given in degrees from now on. https://amospromanual.dev/05-03-maths.html

test.each([
  ['Sin', 'Degree\nX# = Sin(90)', 'X_f = Math.sin((90 * Math.PI) / 180);'],
  ['Cos', 'Degree\nX# = Cos(Y)', 'X_f = Math.cos((Y * Math.PI) / 180);'],
  ['Asin', 'Degree\nX# = Asin(0.5)', 'X_f = (Math.asin(0.5) * 180) / Math.PI;'],
  ['Acos', 'Degree\nX# = Acos(0.5)', 'X_f = (Math.acos(0.5) * 180) / Math.PI;'],
  ['Atan', 'Degree\nX# = Atan(1)', 'X_f = (Math.atan(1) * 180) / Math.PI;'],
])('%s uses degrees after Degree', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
