

class DoomEngine {
    constructor(wadFile, mapName) {
        this.wadFile = wadFile;
        this.wadData = new WADData(this, mapName);
        this.mapRenderer = new MapRenderer(this);
        this.player = new Player(this);
        this.bsp = new BSP(this);
        this.segHandler = new SegHandler(this);
        this.viewRenderer = new ViewRenderer(this);
    }

    degToRad(deg) {
        return deg * Math.PI / 180;
    }

    radToDeg(rad) {
        return rad * 180 / Math.PI;
    }

    update() {
        this.player.update();
        this.segHandler.update();
        this.bsp.update();
        //this.viewRenderer.drawPalette();
        //this.viewRenderer.drawSprite();
    }

    draw() {
        Drawer.ctx.fillStyle = "black";
        Drawer.ctx.fillRect(0, 0, Drawer.canv.width, Drawer.canv.height);
        //Drawer.clear();
        //Drawer.swap();
    }
}

const Main = {
    wadInput: document.getElementById("wadInput"),
    fpsCounter: document.getElementById("fpsCounter"),
    screenRect: Drawer.canv.getBoundingClientRect(),

    wadFile: undefined,
    engine: undefined,

    heldKeys: {},

    lastLoopTime: undefined,
    loopTime: 16,

    applySettings() {
        Drawer.canv.width = WIN_WIDTH;
        Drawer.canv.height = WIN_HEIGHT;
        Drawer.setBuffer();
    },

    captureScreenRect() {
        Main.screenRect = Drawer.canv.getBoundingClientRect();
    },

    async startGame(event) {
        var li = event.target;
        li.parentElement.style.display = "none";
        /*try {
            Main.engine = new DoomEngine(Main.wadFile, li.innerHTML);
        }
        catch (error) {
            console.log(error);
            alert("Something went wrong :(");
            location.reload();
        }*/
        let engine = new Promise(function(resolve, reject) {
            resolve(new DoomEngine(Main.wadFile, li.innerHTML));
        })

        try {Main.engine = await engine;}
        catch (err) {
            console.log(err);
            alert("Something went wring :(");
            location.reload();
        }

        Drawer.canv.parentElement.style.display = "block";
        Main.loop();
        Main.startFPSDisplay();
        Main.captureScreenRect();
    },

    appendMapName(list, name) {
        var li = document.createElement("li");
        li.className = "mapChooser";
        li.innerHTML = name;
        li.onclick = Main.startGame;
        list.appendChild(li);
    },

    listMapNames(file) {
        var reader = new WADReader(file);
        var mapNameContainer = document.getElementById("mapNameList");
        var listTitle = document.createElement("h2");
        listTitle.innerHTML = "Choose map to play:";
        mapNameContainer.appendChild(listTitle);
        for (var entry of reader.directory) {
            if (entry.lumpSize === 0 &&
                entry.lumpOffset !== 0 &&
                entry.lumpName.indexOf("_") === -1 &&
                entry.lumpName !== "REJECT") {
                this.appendMapName(mapNameContainer, entry.lumpName);
            }
        }
        if (mapNameContainer.querySelectorAll("li").length === 0) {
            alert("No maps could be found");
            location.reload();
        }
    },

    captureWADFile(ev) {
        Main.applySettings();
        document.onkeydown = document.onkeyup = Main.collectKeyPresses;
        Main.wadFile = ev.target.result;
        Main.listMapNames(Main.wadFile);
    },

    getWadData(ev) {
        var fileInput = ev.target;
        var wadFile = fileInput.files[0];

        var reader = new FileReader();

        reader.onload = Main.captureWADFile;

        reader.readAsArrayBuffer(wadFile);

        fileInput.parentElement.parentElement.style.display = "none";
    },

    collectKeyPresses(ev) {
        Main.heldKeys[ev.key] = ev.type === "keydown";
    },

    countLoopTime() {
        if (!this.lastLoopTime) {
            this.lastLoopTime = performance.now();
            return false;
        }
        var delta = (performance.now() - this.lastLoopTime);
        this.lastLoopTime = performance.now();
        this.loopTime = delta;
        return true;
    },

    startFPSDisplay() {
        window.setInterval(() => { Main.fpsCounter.innerHTML = (Math.floor(1000 / this.loopTime)) + " fps" }, 1000);
    },

    // for testing only
    drawTexture(textureId) {
        var texture = this.engine.wadData.assetData.getTexture(textureId);
        Drawer.clear();
        Drawer.swap();
        Drawer.ctx.putImageData(texture, 0, 0);
    },

    loop() {
        var timeInitialized = Main.countLoopTime();
        if (!timeInitialized) { window.requestAnimationFrame(Main.loop); return; }

        //Main.engine.draw();
        //Drawer.clear();
        Main.engine.update();
        Drawer.swap();
        Main.engine.viewRenderer.drawSprite();
        //Main.drawRandomTexture();
        //Main.engine.draw(); // I use this function to clear the screen, not to flip buffer. This is why it is before update() method call
        window.requestAnimationFrame(Main.loop);
    },

    initResOptions() {
        var scaleOptions = document.getElementsByClassName("resChooser");
        for (var option of scaleOptions) {
            option.onclick = function (event) {
                var newScale = parseInt(event.target.value);
                SCALE = newScale;
                WIN_WIDTH = Math.floor(DOOM_W * SCALE);
                WIN_HEIGHT = Math.floor(DOOM_H * SCALE);
                WIN_RES = [WIN_WIDTH, WIN_HEIGHT];

                H_WIDTH = WIN_WIDTH / 2;
                H_HEIGHT = WIN_HEIGHT / 2;
                SCREEN_DIST = H_WIDTH / Math.tan(H_FOV * Math.PI / 180);
            }
        }
    },

    activateButtons(event) {
        var relativeTouch = {
            x: event.touches[0].pageX - Main.screenRect.x,
            y: event.touches[0].pageY - Main.screenRect.y
        }
        //movement
        Main.engine.player.setMoveIntensity(relativeTouch, Main.screenRect);
        var forward = relativeTouch.y < Main.screenRect.height / 2;
        if (forward) {
            Main.heldKeys["w"] = true;
            Main.heldKeys["s"] = false;
        }
        else {
            Main.heldKeys["s"] = true;
            Main.heldKeys["w"] = false;
        }
        //roatation
        Main.engine.player.setRotationIntensity(relativeTouch, Main.screenRect);
        var left = relativeTouch.x < Main.screenRect.width / 2;
        if (left) {
            Main.heldKeys["ArrowLeft"] = true;
            Main.heldKeys["ArrowRight"] = false;
        }
        else {
            Main.heldKeys["ArrowRight"] = true;
            Main.heldKeys["ArrowLeft"] = false;
        }
    },

    stopButtons() {
        var keysCaptured = Object.keys(Main.heldKeys);
        for (var key of keysCaptured) {
            Main.heldKeys[key] = false;
        }
        Main.engine.player.moveIntensity = 1;
        Main.engine.player.rotationIntensity = 1;
    },

    initTouchControls() {
        var screen = Drawer.canv;
        screen.ontouchstart = this.activateButtons;
        screen.ontouchmove = this.activateButtons;
        screen.ontouchend = this.stopButtons;
    },

    init() {
        Main.wadInput.oninput = Main.getWadData;
        Main.initResOptions();
        //var enableTouchscreen = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i);
        //var enableTouchscreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
        var enableTouchscreen = window.matchMedia("(pointer: coarse)").matches;
        if (enableTouchscreen) {
            console.log("touchscreen")
            Main.initTouchControls();
            new ResizeObserver(Main.captureScreenRect).observe(Drawer.canv.parentElement);
        }
    }
};

window.onload = Main.init;