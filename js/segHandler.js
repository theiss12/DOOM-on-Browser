class SegHandler {

    getXToAngleTable() {
        var xToAngle = new Array();
        for (var i = 0; i < WIN_WIDTH + 1; i++) {
            var angle = Math.atan((H_WIDTH - i) / SCREEN_DIST) * 180/Math.PI;
            xToAngle.push(angle);
        }
        return xToAngle;
    }

    constructor(engine) {
        this.MAX_SCALE = 64;
        this.MIN_SCALE = 0.00390625;
        this.engine = engine;
        this.wadData = engine.wadData;
        this.player = engine.player;
        this.textures = this.wadData.assetData.textures;
        this.skyId = this.wadData.assetData.skyId;

        this.seg = undefined;
        this.rwAngle1 = undefined;
        this.screenRange = new Array();
        this.upperClip = new Array();
        this.lowerClip = new Array();
        this.numSegsHandled = 0;

        this.xToAngle = this.getXToAngleTable();

    }

    update() {
        this.numSegsHandled = 0;
        this.initFloorCeilClipHeight();
        this.initScreenRange();
    }

    degToRad(d) {
        return d * Math.PI / 180;
    }

    radToDeg(r) {
        return r * 180 / Math.PI;
    }

    getNumberSet(start, end, step) {
        var set = new Array();
        for (var i = start; i < end; i += step) {
            set.push(i);
        }
        return set;
    }

    getSetIntersection(set1, set2) {
        return set1.filter(value => set2.includes(value));
    }

    subtractSets(set1,set2) {
        return set1.filter(value => !set2.includes(value));
    }

    hasNumbers(set) {
        return set.length > 0;
    }

    getSortedSet(set) {
        return set.toSorted(function(a, b) {return a - b});
    }

    dist(p1, p2) {
        var a = p1.x - p2.x;
        var b = p1.y - p2.y;
        var cSq = a*a+b*b;
        return Math.sqrt(cSq);
    }

    drawSolidWallRange(x1, x2) {
        // some aliases to shorten the following code
        var seg = this.seg
        var frontSector = seg.frontSector
        var line = seg.linedef
        var side = seg.linedef.frontSidedef
        var renderer = this.engine.viewRenderer
        var upperClip = this.upperClip
        var lowerClip = this.lowerClip
    
        // textures
        var wallTextureId = seg.linedef.frontSidedef.middleTexture
        var ceilTextureId = frontSector.ceilTexture
        var floorTextureId = frontSector.floorTexture
        var lightLevel = frontSector.lightLevel
    
        // calculate the relative plane heights of front sector
        var worldFrontZ1 = frontSector.ceilHeight - this.player.height
        var worldFrontZ2 = frontSector.floorHeight - this.player.height
    
        // check which parts must be rendered
        var bDrawWall = side.middleTexture != '-'
        var bDrawCeil = worldFrontZ1 > 0 || frontSector.ceilTexture === this.skyId;
        var bDrawFloor = worldFrontZ2 < 0
    
        // calculate the scaling factors of the left and right edges of the wall range
        var rwNormalAngle = seg.angle + 90
        var offsetAngle = rwNormalAngle - this.rwAngle1
    
        var hypotenuse = this.dist(this.player.pos, seg.startVertex)
        var rwDistance = hypotenuse * Math.cos(this.degToRad(offsetAngle))
    

        var rwScale1 = this.scaleFromGlobalAngle(x1, rwNormalAngle, rwDistance)
        // stretched line fix??
        /*var testAngle = Math.abs(offsetAngle % 360);
        if (testAngle >= 89 && testAngle <= 91) {
            rwScale1 * 0.01;
        }*/

        if (x1 < x2) {
            var scale2 = this.scaleFromGlobalAngle(x2, rwNormalAngle, rwDistance)
            var rwScaleStep = (scale2 - rwScale1) / (x2 - x1)
        }
        else {
            rwScaleStep = 0
        }

        var wallTexture = this.wadData.assetData.getTexture(wallTextureId);//this.textures[wallTextureId];
        //if (!wallTexture) wallTexture = this.wadData.assetData.unknownTexture;
        if (line.flags & this.wadData.LINEDEF_FLAGS["DONT_PEG_BOTTOM"]) {
            var vTop = frontSector.floorHeight + wallTexture.height; // walltexture.height is .shape[1] from numpy???
            var middleTexAlt = vTop - this.player.height;
        }
        else middleTexAlt = worldFrontZ1;
        middleTexAlt += side.yOffset;
        var rwOffset = hypotenuse * Math.sin(this.degToRad(offsetAngle));
        rwOffset += seg.offset + side.xOffset;
        var rwCenterAngle = rwNormalAngle - this.player.angle;

        // determine where on the screen the wall is drawn
        var wallY1 = H_HEIGHT - worldFrontZ1 * rwScale1
        var wallY1Step = -rwScaleStep * worldFrontZ1
    
        var wallY2 = H_HEIGHT - worldFrontZ2 * rwScale1
        var wallY2Step = -rwScaleStep * worldFrontZ2
    
        // now the rendering is carried out
        for (var x = x1; x < x2 + 1; x++) {
            var drawWallY1 = wallY1 - 1
            var drawWallY2 = wallY2
            //
            if (bDrawCeil) {
                var cy1 = upperClip[x] + 1
                var cy2 = Math.floor(Math.min(drawWallY1 - 1, lowerClip[x] - 1))
                renderer.drawFlat(ceilTextureId, lightLevel, x, cy1, cy2+1, worldFrontZ1);
            }
            //
            if (bDrawWall) {
                var wy1 = Math.floor(Math.max(drawWallY1, upperClip[x] + 1))
                var wy2 = Math.floor(Math.min(drawWallY2, lowerClip[x] - 1))
                if (wy1 < wy2) {
                    var angle = rwCenterAngle - this.xToAngle[x];
                    var textureColumn = rwDistance * Math.tan(this.degToRad(angle)) - rwOffset;
                    var invScale = 1 / rwScale1;
                    renderer.drawWall(undefined, wallTexture, textureColumn, x, wy1, wy2, middleTexAlt, invScale, lightLevel);
                }
            }
            //
            if (bDrawFloor) {
                var fy1 = Math.floor(Math.max(drawWallY2 + 1, upperClip[x] + 1))
                var fy2 = lowerClip[x] - 1
                renderer.drawFlat(floorTextureId, lightLevel, x, fy1-1, fy2+1, worldFrontZ2);
            }
            //
            wallY1 += wallY1Step
            wallY2 += wallY2Step
            rwScale1 += rwScaleStep;
        }
    }

    scaleFromGlobalAngle(x, rwNormalAngle, rwDistance) {
        var xAngle = this.xToAngle[x];
        var num = SCREEN_DIST * Math.cos(this.degToRad(rwNormalAngle - xAngle - this.player.angle));
        var den = rwDistance * Math.cos(this.degToRad(xAngle));

        var scale = num / den;
        scale = Math.min(this.MAX_SCALE, Math.max(this.MIN_SCALE, scale));
        return scale;
    }

    initScreenRange() {
        this.screenRange = this.getNumberSet(0, WIN_WIDTH, 1);
    }

    initFloorCeilClipHeight() {
        /*var up = new Array();
        var lo = new Array();
        for (var i = 0; i < WIN_WIDTH; i++) {
            up.push(-1);
            lo.push(WIN_HEIGHT)
        }
        this.upperClip = up;
        this.lowerClip = lo;*/
        this.upperClip = Array(WIN_WIDTH).fill(-1);
        this.lowerClip = Array(WIN_WIDTH).fill(WIN_HEIGHT);
    }

    drawPortalWallRange(x1, x2) {
        // some aliases to shorten the following code
        var seg = this.seg
        var frontSector = seg.frontSector
        var backSector = seg.backSector
        var line = seg.linedef
        var side = seg.linedef.frontSidedef
        var renderer = this.engine.viewRenderer
        var upperClip = this.upperClip
        var lowerClip = this.lowerClip
    
        // textures
        //var upperWallTexture = side.upperTexture
        //var lowerWallTexture = side.lowerTexture
        var texCeilId = frontSector.ceilTexture
        var texFloorId = frontSector.floorTexture
        var lightLevel = frontSector.lightLevel
    
        // calculate the relative plane heights of front && back sector
        var worldFrontZ1 = frontSector.ceilHeight - this.player.height
        var worldBackZ1 = backSector.ceilHeight - this.player.height
        var worldFrontZ2 = frontSector.floorHeight - this.player.height
        var worldBackZ2 = backSector.floorHeight - this.player.height
    
        // sky hack
        if (frontSector.ceilTexture === backSector.ceilTexture && frontSector.ceilTexture === this.skyId && backSector.ceilTexture === this.skyId){
            worldFrontZ1 = worldBackZ1;
            //console.log(frontSector.ceilTexture, backSector.ceilTexture, this.skyId, worldFrontZ1, worldBackZ1);
        } //else console.log(frontSector.ceilTexture, backSector.ceilTexture, this.skyId, worldFrontZ1, worldBackZ1);

        // check which parts must be rendered
        if (worldFrontZ1 != worldBackZ1 ||
                frontSector.lightLevel != backSector.lightLevel ||
                frontSector.ceilTexture != backSector.ceilTexture) {
            var bDrawUpperWall = side.upperTexture != '-' && worldBackZ1 < worldFrontZ1
            var bDrawCeil = worldFrontZ1 >= 0 || frontSector.ceilTexture === this.skyId;
        }
        else {
            bDrawUpperWall = false
            bDrawCeil = false
        }
    
        if (worldFrontZ2 != worldBackZ2 ||
                frontSector.floorTexture != backSector.floorTexture ||
                frontSector.lightLevel != backSector.lightLevel) {
            var bDrawLowerWall = side.lowerTexture != '-' && worldBackZ2 > worldFrontZ2
            var bDrawFloor = worldFrontZ2 <= 0
        }
        else {
            bDrawLowerWall = false
            bDrawFloor = false
        }
        // if nothing must be rendered, we can skip this seg
        if (!bDrawUpperWall && !bDrawCeil && !bDrawLowerWall &&
                !bDrawFloor) {
            return undefined;
        }
    
        // calculate the scaling factors of the left && right edges of the wall range
        var rwNormalAngle = seg.angle + 90
        var offsetAngle = rwNormalAngle - this.rwAngle1
    
        var hypotenuse = this.dist(this.player.pos, seg.startVertex)
        var rwDistance = hypotenuse * Math.cos(this.degToRad(offsetAngle))
    
        var rwScale1 = this.scaleFromGlobalAngle(x1, rwNormalAngle, rwDistance)
        // stretched line fix ??
        /*var testAngle = Math.abs(offsetAngle % 360);
        if (testAngle >= 89 && testAngle <= 91) {
            rwScale1 * 0.01;
        }*/

        if (x2 > x1) {
            var scale2 = this.scaleFromGlobalAngle(x2, rwNormalAngle, rwDistance)
            var rwScaleStep = (scale2 - rwScale1) / (x2 - x1)
        }
        else {
            rwScaleStep = 0
        }

        if (bDrawUpperWall) {
            var upperWallTexture = this.wadData.assetData.getTexture(side.upperTexture);//this.textures[side.upperTexture];
            //if (!upperWallTexture) upperWallTexture = this.wadData.assetData.unknownTexture;

            if (line.flags & this.wadData.LINEDEF_FLAGS['DONT_PEG_TOP']) {
                var upperTexAlt = worldFrontZ1;
            }
            else {
                var vTop = backSector.ceilHeight + upperWallTexture.height;
                upperTexAlt = vTop - this.player.height;
            }
            upperTexAlt += side.yOffset;
        }

        if (bDrawLowerWall) {
            var lowerWallTexture = this.wadData.assetData.getTexture(side.lowerTexture);//this.textures[side.lowerTexture];
            //if (!lowerWallTexture) lowerWallTexture = this.wadData.assetData.unknownTexture;

            if (line.flags & this.wadData.LINEDEF_FLAGS['DONT_PEG_BOTTOM']) {
                var lowerTexAlt = worldFrontZ1;
            }
            else {
                lowerTexAlt = worldBackZ2;
            }
            lowerTexAlt += side.yOffset
        }

        var segTextured = bDrawUpperWall || bDrawLowerWall;
        if (segTextured) {
            var rwOffset = hypotenuse * Math.sin(this.degToRad(offsetAngle));
            rwOffset += seg.offset + side.xOffset;
            var rwCenterAngle = rwNormalAngle - this.player.angle;
        }
        // the y positions of the top / bottom edges of the wall on the screen
        var wallY1 = H_HEIGHT - worldFrontZ1 * rwScale1
        var wallY1Step = -rwScaleStep * worldFrontZ1
        var wallY2 = H_HEIGHT - worldFrontZ2 * rwScale1
        var wallY2Step = -rwScaleStep * worldFrontZ2
    
        // the y position of the top edge of the portal
        if (bDrawUpperWall) {
            if (worldBackZ1 > worldFrontZ2) {
                var portalY1 = H_HEIGHT - worldBackZ1 * rwScale1
                var portalY1Step = -rwScaleStep * worldBackZ1
            }
            else {
                portalY1 = wallY2
                portalY1Step = wallY2Step
            }
        }
        if (bDrawLowerWall) {
            if (worldBackZ2 < worldFrontZ1) {
                var portalY2 = H_HEIGHT - worldBackZ2 * rwScale1
                var portalY2Step = -rwScaleStep * worldBackZ2
            }
            else {
                portalY2 = wallY1
                portalY2Step = wallY1Step
            }
        }
        // now the rendering is carried out
        for (var x = x1; x < x2 + 1; x++) {
            var drawWallY1 = wallY1 - 1;
            var drawWallY2 = wallY2;
            if (segTextured) {
                var angle = rwCenterAngle - this.xToAngle[x];
                var textureColumn = rwDistance * Math.tan(this.degToRad(angle)) - rwOffset;
                var invScale = 1 / rwScale1;
            }
    
            if (bDrawUpperWall) {
                var drawUpperWallY1 = wallY1 - 1
                var drawUpperWallY2 = portalY1
                //

                if (bDrawCeil) {
                    var cy1 = upperClip[x] + 1
                    var cy2 = Math.floor(Math.min(drawWallY1 - 1, lowerClip[x] - 1))
                    renderer.drawFlat(texCeilId, lightLevel, x, cy1, cy2+1, worldFrontZ1);
                }
                //
                var wy1 = Math.floor(Math.max(drawUpperWallY1, upperClip[x] + 1))
                var wy2 = Math.floor(Math.min(drawUpperWallY2, lowerClip[x] - 1))
                renderer.drawWall(undefined, upperWallTexture, textureColumn, x, wy1, wy2,
                    upperTexAlt, invScale, lightLevel);                
                //
                if (upperClip[x] < wy2) {
                    upperClip[x] = wy2
                }
                //
                portalY1 += portalY1Step
            }
            if (bDrawCeil) {
                cy1 = upperClip[x] + 1
                cy2 = Math.floor(Math.min(drawWallY1 - 1, lowerClip[x] - 1))
                renderer.drawFlat(texCeilId, lightLevel, x, cy1, cy2+1, worldFrontZ1);
            
                //
                if (upperClip[x] < cy2) {
                    upperClip[x] = cy2
                }
            }
            if (bDrawLowerWall) {
                //
                if (bDrawFloor) {
                    var fy1 = Math.floor(Math.max(drawWallY2 + 1, upperClip[x] + 1))
                    var fy2 = lowerClip[x] - 1
                    renderer.drawFlat(texFloorId, lightLevel, x, fy1-1, fy2+1, worldFrontZ2);
                }
                //
                var drawLowerWallY1 = portalY2 - 1
                var drawLowerWallY2 = wallY2
                //
                wy1 = Math.floor(Math.max(drawLowerWallY1, upperClip[x] + 1))
                wy2 = Math.floor(Math.min(drawLowerWallY2, lowerClip[x] - 1))
                renderer.drawWall(undefined, lowerWallTexture, textureColumn, x, wy1, wy2,
                    lowerTexAlt, invScale, lightLevel);
                //
                if (lowerClip[x] > wy1) {
                    lowerClip[x] = wy1
                }
                //
                portalY2 += portalY2Step
            }
            if (bDrawFloor) {
                //
                fy1 = Math.floor(Math.max(drawWallY2 + 1, upperClip[x] + 1))
                fy2 = lowerClip[x] - 1
                renderer.drawFlat(texFloorId, lightLevel, x, fy1-1, fy2+1, worldFrontZ2);
                //
                if (lowerClip[x] > drawWallY2 + 1) {
                    lowerClip[x] = fy1
                }
            }
            rwScale1 += rwScaleStep;
            wallY1 += wallY1Step
            wallY2 += wallY2Step
        }
    }

    clipPortalWalls(xStart, xEnd) {
        var currWall = this.getNumberSet(xStart, xEnd, 1);
        var intersection = this.getSetIntersection(currWall, this.screenRange);
        if (this.hasNumbers(intersection)) {
            if (intersection.length === currWall.length) {
                this.drawPortalWallRange(xStart, xEnd - 1);
            }
            else {
                var arr = this.getSortedSet(intersection);
                var x = arr[0];
                for (var i = 0; i < arr.length - 1; i++) {
                    var x1 = arr[i];
                    var x2 = arr[i + 1];
                    if (x2 - x1 > 1) {
                        this.drawPortalWallRange(x, x1);
                        x = x2;
                    }
                }
                this.drawPortalWallRange(x, arr[arr.length - 1])
            }
        }
    }

    clipSolidWalls(xStart, xEnd) {
        if (this.hasNumbers(this.screenRange)) {
            var currWall = this.getNumberSet(xStart, xEnd, 1);
            var intersection = this.getSetIntersection(currWall, this.screenRange);
            if (this.hasNumbers(intersection)) {
                if (intersection.length === currWall.length) {
                    this.drawSolidWallRange(xStart, xEnd - 1);
                }
                else {
                    var arr = this.getSortedSet(intersection);
                    var x = arr[0];
                    var x2 = arr[arr.length - 1];
                    for (var i = 0; i < arr.length - 1; i++) {
                        var x1 = arr[i];
                        x2 = arr[i + 1];
                        if (x2 - x1 > 1) {
                            this.drawSolidWallRange(x, x1);
                            x = x2;
                        }
                    }
                    this.drawSolidWallRange(x, x2);
                }
                this.screenRange = this.subtractSets(this.screenRange, intersection);
            }
        }
        else {
            this.engine.bsp.isTraverseBsp = false;
        }
    }

    classifySegment(segment, x1, x2, rwAngle1) {
        // player height checking hack
        this.numSegsHandled++;
        if (this.numSegsHandled === 1) {
            var floorHeight = segment.frontSector.floorHeight;
            this.engine.player.height = floorHeight + PLAYER_HEIGHT;
        }
        //---

        this.seg = segment;
        this.rwAngle1 = rwAngle1;

        if (x1 === x2) return undefined;

        var backSector = segment.backSector;
        var frontSector = segment.frontSector;
        
        if (!backSector) {
            this.clipSolidWalls(x1, x2);
            return undefined;
        }

        // wall with window
        if (frontSector.ceilHeight !== backSector.ceilHeight ||
            frontSector.floorHeight !== backSector.floorHeight) {
            this.clipPortalWalls(x1, x2)
            return undefined;
        }

        // skip rendering 
        if (backSector.ceilTexture === frontSector.ceilTexture &&
            backSector.floorTexture === frontSector.floorTexture &&
            backSector.lightLevel === frontSector.lightLevel &&
            this.seg.linedef.frontSidedef.middleTexture === "-") {
            return undefined;
        }

        this.clipPortalWalls(x1, x2);
    }
}