/** AMOS commands of the category "Reserved Variable", sorted A-Z by AMOS name. */
export default class ReservedVariables {
  constructor(context) {
    this.context = context;
    this.expressions = context.expressions;
  }

  // X MOUSE
  translateXMouse(ctx) {
    console.log('to be implemented');
  }

  enterXMouseAssignment(ctx) {
    console.log('to be implemented');
  }

  // Y MOUSE
  translateYMouse(ctx) {
    console.log('to be implemented');
  }

  enterYMouseAssignment(ctx) {
    console.log('to be implemented');
  }
}
