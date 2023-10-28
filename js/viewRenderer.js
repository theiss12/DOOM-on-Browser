class ViewRenderer {
    constructor(engine) {
        this.engine = engine;
        this.player = engine.player;
        this.assetData = engine.wadData.assetData;
        this.palette = engine.wadData.assetData.palette;
        this.sprites = this.assetData.sprites;
        this.textures = this.assetData.textures;
        this.screen = Drawer.canv;
        this.colors = new Object();

        this.skyId = this.assetData.skyId
        this.skyTex = this.assetData.skyTex
        this.skyInvScale = 160 / WIN_HEIGHT
        this.skyTexAlt = 100

        this.spriteBuffer = new OffscreenCanvas(1, 1);
        this.bufferCtx = this.spriteBuffer.getContext("2d");
    }

    drawSprite() {
        var img = this.sprites["SHTGA0"];
        var x = Math.floor(H_WIDTH - img.width / 2);
        var y = WIN_HEIGHT - img.height;
        Drawer.ctx.drawImage(img, x, y);
    }

    drawPalette() {
        var pal = this.palette;
        var size = 4;
        for (var ix = 0; ix < 16; ix++) {
            for (var iy = 0; iy < 16; iy++) {
                var col = pal[iy * 16 + ix];
                Drawer.rect(ix * size, iy * size, size, size, col.style);
            }
        }
    }

    getColor(tex, lightLevel) {
        var id = tex + lightLevel;
        if (!this.colors[id]) {
            var bc = this.palette[Color.randInt(0, 255)]
            var tone = lightLevel / 255;
            var newColor = new Color(bc.r * tone, bc.g * tone, bc.b * tone);
            this.colors[id] = newColor;//Color.getRandom();
        }
        return this.colors[id];
    }

    drawVline(x, y1, y2, tex, light) {
        /*var p1 = {x: x, y: y1};
        var p2 = {x: x, y: y2};
        var style = tex === "FLAT" ? "rgb(255,255,255)" : this.getColor(tex, light).getStyleRGB();
        var width = 2;
        Drawer.line(p1, p2, style, width)*/

        /*if (y2 < y1) return;
        var style = this.getColor(tex, light).style;//getStyleRGB();
        Drawer.verticalLine(x, y1, y2, style)*/

        if (y1 < y2) {
            var color = this.getColor(tex, light);
            this.drawColumn(x, y1, y2, color);
        }
    }

    drawColumn(x, y1, y2, color) {
        for (var iy = y1; iy < y2 + 1; iy++) {
            Drawer.pixel(x, iy, color);
        }
    }

    drawWall(
        framebuffer, // Drawer.buffer
        tex, // assetData.textures[n]
        texCol, // "texture column" so texture x??
        x, // framebuffer horizontal pos
        y1, // framebuffer vertical start (top) pos
        y2, // framebuffer vertical end (bottom) pos
        texAlt, // "texture altitude" so texture y???
        invScale,
        lightLevel
    ) {
        if (y1 < y2) {
            var texW = tex.width;
            var texH = tex.height;

            texCol = Math.floor(texCol) % texW; // can be negative??
            if (texCol < 0) texCol *= -1;

            var texY = texAlt + (y1 - H_HEIGHT) * invScale; // cast y1 to float???

            for (var iy = y1; iy < y2 + 1; iy++) {
                var texRow = Math.floor(texY) % texH; // can be negative??
                if (texRow < 0) texRow *= -1;

                var pixelIndex = 4 * (texW * Math.floor(texRow) + Math.floor(texCol));
                var pixelData = tex.data;
                var brightness = lightLevel / 255;
                var col = {
                    r: pixelData[pixelIndex] * brightness,
                    g: pixelData[pixelIndex + 1] * brightness,
                    b: pixelData[pixelIndex + 2] * brightness
                };
                Drawer.pixel(x, iy, col);
                texY += invScale;
            }
        }
    }
    
    drawFlatCol(screen, flatTex, x, y1, y2, lightLevel, worldZ,
        playerAngle, playerX, playerY) {
        var playerDirX = Math.cos(this.engine.segHandler.degToRad(playerAngle));
        var playerDirY = Math.sin(this.engine.segHandler.degToRad(playerAngle));

        for (var iy = y1; iy < y2; iy++) {
            var z = H_WIDTH * worldZ / (H_HEIGHT - iy)

            var px = playerDirX * z + playerX;
            var py = playerDirY * z + playerY;

            var leftX = -playerDirY * z + px
            var leftY = playerDirX * z + py
            var rightX = playerDirY * z + px
            var rightY = -playerDirX * z + py

            var dx = (rightX - leftX) / WIN_WIDTH
            var dy = (rightY - leftY) / WIN_WIDTH

            var tx = Math.floor(leftX + dx * x) & 63;
            var ty = Math.floor(leftY + dy * x) & 63;

            var pixelIndex = 4 * (flatTex.width * Math.floor(ty) + Math.floor(tx));
            var flatData = flatTex.data;
            var brightness = lightLevel / 255;
            var col = {
                r: flatData[pixelIndex] * brightness,
                g: flatData[pixelIndex + 1] * brightness,
                b: flatData[pixelIndex + 2] * brightness
            }
            Drawer.pixel(x, iy, col);
        }
    }

    drawFlat(texId, lightLevel, x, y1, y2, worldZ) {
        if (y1 < y2) {
            if (texId === this.skyId) {
                var texColumn = 2.2 * (this.player.angle + this.engine.segHandler.xToAngle[x]);

                this.drawWall(undefined, this.skyTex, texColumn, x, y1, y2,
                                this.skyTexAlt, this.skyInvScale, 255);
            }
            else {
                //var flatTex = this.textures[texId];
                //if (!flatTex) flatTex = this.assetData.unknownTexture;
                var flatTex = this.assetData.getTexture(texId);

                this.drawFlatCol(undefined, flatTex,
                                x, y1, y2, lightLevel, worldZ,
                                this.player.angle, this.player.pos.x, this.player.pos.y);
            }
        }
    }
}