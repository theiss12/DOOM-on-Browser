class Patch {
    constructor(assetData, name, isSprite = true) {
        this.assetData = assetData;
        this.name = name;

        this.palette = assetData.palette;
        var load = this.loadPatchColumns(name);
        this.header = load.header;
        this.patchColumns = load.columns;
        this.width = this.header.width;
        this.height = this.header.height;
        this.image = this.getImage();
        if (isSprite) {
            var scaled = new OffscreenCanvas(this.image.width * SCALE, this.image.height * SCALE)
            var scaleCtx = scaled.getContext("2d");
            scaleCtx.imageSmoothingEnabled = false;
            scaleCtx.drawImage(this.image, 0, 0, scaled.width, scaled.height);
            this.image = scaled;
        }
    }

    loadPatchColumns(patchName) {
        var reader = this.assetData.reader;
        var patchIndex = this.assetData.getLumpIndex(patchName);
        var patchOffset = reader.directory[patchIndex]["lumpOffset"];
        var patchHeader = this.assetData.reader.readPatchHeader(patchOffset);
        var patchColumns = new Array();

        for (var i = 0; i < patchHeader.width; i++) {
            var offs = patchOffset + patchHeader.columnOffset[i];
            while (true) {
                var reading = reader.readPatchColumn(offs);
                var patchColumn = reading.pc;
                offs = reading.offs;
                patchColumns.push(patchColumn);
                if (patchColumn.topDelta === 0xff) break;
            }
        }
        return { header: patchHeader, columns: patchColumns };
    }

    getImage() {
        var image = new OffscreenCanvas(this.width, this.height);
        var ctx = image.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var imageData = ctx.createImageData(image.width, image.height);
        var data = imageData.data;
        var ix = 0;
        for (var column of this.patchColumns) {
            if (column.topDelta === 0xff) {
                ix++;
                continue;
            }
            for (var iy = 0; iy < column.length; iy++) {
                var colorIdx = column.data[iy];
                var color = this.palette[colorIdx];
                //ctx.fillStyle = color.style;
                //ctx.fillRect(ix, iy + column.topDelta, 1, 1);
                var index = 4 * (image.width * Math.floor(iy + column.topDelta) + Math.floor(ix));
                data[index] = color.r;
                data[index + 1] = color.g;
                data[index + 2] = color.b;
                data[index + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return image;
    }
}

class Texture {
    constructor(assetData, texMap) {
        this.assetData = assetData;
        this.texMap = texMap;
        this.image = this.getImage();
    }

    getImage() {
        var image = new OffscreenCanvas(this.texMap.width, this.texMap.height);
        var ctx = image.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        for (var patchMap of this.texMap.patchMaps) {
            var patch = this.assetData.texturePatches[patchMap.pNameIndex];
            /*var buffer = new OffscreenCanvas(patch.image.width, patch.image.height);
            var bufferCtx = buffer.getContext("2d");
            bufferCtx.putImageData(patch.image, 0, 0);
            ctx.drawImage(buffer, patchMap.xOffset, patchMap.yOffset);*/
            ctx.drawImage(patch.image, patchMap.xOffset, patchMap.yOffset)
        }
        return ctx.getImageData(0, 0, image.width, image.height);
    }
}

class Flat {
    constructor(assetData, flatData) {
        this.flatData = flatData;
        this.palette = assetData.palette;
        this.image = this.getImage();
    }

    getImage() {
        var image = new OffscreenCanvas(64, 64); // apparently, all flats are this size
        var ctx = image.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var imageData = ctx.createImageData(image.width, image.height);
        var data = imageData.data;
        for (var i = 0; i < this.flatData.length; i++) {
            var ix = i % 64;
            var iy = Math.floor(i / 64);
            var colorIdx = this.flatData[i];
            var color = this.palette[colorIdx];
            //ctx.fillStyle = color.style;
            //ctx.fillRect(ix, iy, 1, 1);
            var index = 4 * (image.width * Math.floor(iy) + Math.floor(ix));
            data[index] = color.r;
            data[index + 1] = color.g;
            data[index + 2] = color.b;
            data[index + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        return ctx.getImageData(0, 0, image.width, image.height);
    }
}

class AssetData {
    constructor(wadData) {
        this.wadData = wadData;
        this.reader = wadData.reader;
        this.getLumpIndex = wadData.getLumpIndex;
        this.unknownTexture = this.createUnknownTexture(64, 8);

        this.palettes = this.wadData.getLumpData(
            "readPalette",
            this.getLumpIndex("PLAYPAL"),
            256 * 3
        );

        this.palette_idx = 0;
        this.palette = this.palettes[this.palette_idx];
        this.sprites = this.getSprites("S_START", "S_END");

        this.pNames = this.wadData.getLumpData( // here we get one too many :O ???
            "readString",
            this.getLumpIndex("PNAMES"),
            8,
            4
        );
        // this.pNames.pop();

        this.texturePatches = new Array();
        for (var i = 0; i < this.pNames.length; i++) {
            var pName = this.pNames[i];
            //console.log(i, pName);
            var testIndex = this.getLumpIndex(pName);
            var upperPName = pName.toUpperCase();
            if (testIndex < 0) testIndex = this.getLumpIndex(upperPName);
            if (testIndex < 0) {
                this.texturePatches.push(null);
                continue;
            }
            else pName = upperPName;
            var patch = new Patch(this, pName, false);
            this.texturePatches.push(patch);
        }

        var textureMaps = this.loadTextureMaps("TEXTURE1");
        if (this.getLumpIndex("TEXTURE2") >= 0) {
            textureMaps = textureMaps.concat(
                this.loadTextureMaps("TEXTURE2")
            );
        }
        this.textures = new Object();
        for (var texMap of textureMaps) {
            this.textures[texMap.name] = new Texture(this, texMap).image;
        }
        this.textures = { ...this.textures, ...this.getFlats() } // ?? merge or concatenate???
        this.skyId = "F_SKY1"; // always?
        this.skyTexName = "SKY1"; // always?
        this.skyTex = this.textures[this.skyTexName];
    }

    createUnknownTexture(sideLength = 64, numSquares = 8) {
        var canvas = new OffscreenCanvas(sideLength, sideLength);
        var ctx = canvas.getContext("2d");
        var squareLength = sideLength / numSquares;

        for (var y = 0; y < numSquares; y++) {
            for (var x = 0; x < numSquares; x++) {
                var evenRow = y % 2 === 0;
                var evenCol = x % 2 === 0;
                var blue = "rgb(0,0,255)";
                var yellow = "rgb(255,255,0)";
                var style;
                if (evenRow && evenCol) style = blue;
                if (evenRow && !evenCol) style = yellow;
                if (!evenRow && evenCol) style = yellow;
                if (!evenRow && !evenCol) style = blue;
                ctx.fillStyle = style;
                ctx.fillRect(x * squareLength, y * squareLength, squareLength, squareLength);
            }
        }
        return ctx.getImageData(0, 0, sideLength, sideLength);
    }

    getTexture(textureId) {
        var texture = this.textures[textureId];
        if (texture) return texture;
        texture = this.textures[textureId.toUpperCase()];
        if (texture) return texture;
        texture = this.textures[textureId.toLowerCase()];
        if (texture) return texture;
        return this.unknownTexture;
    }

    getSprites(startMarker = "S_START", endMarker = "S_END") {
        var idx1 = this.getLumpIndex(startMarker) + 1;
        var idx2 = this.getLumpIndex(endMarker); // exclusive
        var lumpInfo = this.reader.directory.slice(idx1, idx2);
        var sprites = new Object();
        for (var lump of lumpInfo) {
            var patch = new Patch(this, lump["lumpName"])
            if (patch) sprites[lump["lumpName"]] = patch.image;
        }
        return sprites;
    }

    getFlats(startMarker = "F_START", endMarker = "F_END") {
        var idx1 = this.getLumpIndex(startMarker) + 1;
        var idx2 = this.getLumpIndex(endMarker);
        var flatLumps = this.reader.directory.slice(idx1, idx2);

        var flats = new Object();
        for (var flatLump of flatLumps) {
            var offset = flatLump["lumpOffset"];
            var size = flatLump["lumpSize"];

            var flatData = new Array();
            for (var i = 0; i < size; i++) {
                flatData.push(this.reader.read1ByteUnsigned(offset + i));
            }
            //console.log(flatData);
            var flatName = flatLump["lumpName"];
            flats[flatName] = new Flat(this, flatData).image;
        }
        return flats;
    }

    loadTextureMaps(textureLumpName) {
        var texIdx = this.getLumpIndex(textureLumpName);
        var offset = this.reader.directory[texIdx]["lumpOffset"];

        var textureHeader = this.reader.readTextureHeader(offset);
        var textureMaps = new Array();
        for (var i = 0; i < textureHeader.textureCount; i++) {
            var texMap = this.reader.readTextureMap(
                offset + textureHeader.textureDataOffset[i]
            );
            textureMaps.push(texMap);
        }
        return textureMaps;
    }
}