class ControlAction {
    constructor(key, target, targetProperty, changeValue) {
        this.key = key;
        this.target = target;
        this.targetProperty = targetProperty;
        this.changeValue = changeValue;
    }

    actuate() {
        if (!Controller.heldKeys[this.key]) return false;
        this.target[this.targetProperty] += this.changeValue;
        return true;
    }
}

class Controller {
    constructor(...actions) {
        this.actions = actions;
    }

    executeActions() {
        for (var action of this.actions) {
            action.actuate();
        }
    }
}

Controller.heldKeys = {};

Controller.controllers = new Array();

Controller.collectKeyPresses = function(ev) {
    Controller.heldKeys[ev.key] = ev.type === "keydown";
};

Controller.init = function() {
    document.onkeydown = document.onkeyup = this.collectKeyPresses;
}