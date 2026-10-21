import AMCAFListener from "./AMCAFListener.js";

class AMCAFTranslator extends AMCAFListener {
    constructor() {
        super();
    }

    enterAmcaf(ctx) {
        console.log("You are using AMCAF extension!");
    }
}

export default AMCAFTranslator;