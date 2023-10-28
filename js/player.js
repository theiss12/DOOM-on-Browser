class Player {
    constructor(engine) {
        this.engine = engine;
        this.thing = engine.wadData.things[0];
        this.pos = this.thing.pos;
        this.angle = this.thing.angle;
        this.DIAG_MOVE_CORR = 1 / Math.sqrt(2);
        this.height = PLAYER_HEIGHT;

        this.moveIntensity = 1;
        this.rotationIntensity = 1;
    }

    update() {
        //this.getHeight();
        this.control();
    }

    getHeight() {
        this.height = this.engine.bsp.getSubSectorHeight() + PLAYER_HEIGHT;
    }

    setMoveIntensity(touch, screen) {
        var middle = {
            x: screen.width / 2,
            y: screen.height / 2
        }
        var distance = this.engine.segHandler.dist(touch, middle);
        this.moveIntensity = distance / middle.y;
    }

    setRotationIntensity(touch, screen) {
        var screenHalf = screen.width / 2;
        var distance = touch.x < screenHalf ? screenHalf - touch.x : touch.x - screenHalf;
        this.rotationIntensity = distance / screenHalf;
    }

    control() {
        var deltaTime = Main.loopTime * 2.5;//60;
        var speed = PLAYER_SPEED * deltaTime * this.moveIntensity;
        var rotSpeed = PLAYER_ROT_SPEED * deltaTime * this.rotationIntensity;
        //rotate
        if (Main.heldKeys["ArrowLeft"]) this.angle += rotSpeed;
        if (Main.heldKeys["ArrowRight"]) this.angle -= rotSpeed;
        // loop back if past 360 or under 0???!!

        
        var inc = new vec2(0,0);
        if (Main.heldKeys["a"]) {
            inc.y = speed;
        }
        if (Main.heldKeys["d"]) {
            inc.y = -speed;
        }
        if (Main.heldKeys["w"]) {
            inc.x = speed;
        }
        if (Main.heldKeys["s"]) {
            inc.x = -speed;
        }
        inc.rotate(this.angle);
        if (inc.x && inc.y) inc.multiplyEquals(this.DIAG_MOVE_CORR);
        this.pos.plusEquals(inc);
    }
}