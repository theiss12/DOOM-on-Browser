class WADData {
    LUMP_INDICES = {
        THINGS: 1, LINEDEFS: 2, SIDEDEFS: 3, VERTEXES: 4, SEGS: 5,
        SSECTORS: 6, NODES: 7, SECTORS: 8, REJECT: 9, BLOCKMAP: 10
    }

    LINEDEF_FLAGS = {
        BLOCKING: 1, BLOCK_MONSTERS: 2, TWO_SIDED: 4, DONT_PEG_TOP: 8,
        DONT_PEG_BOTTOM: 16, SECRET: 32, SOUND_BLOCK: 64, DONT_DRAW: 128, MAPPED: 256
    }

    /*
    -BUG1:
    "this" in readVertex does not reference anything when passing it like this
    maybe pass reader and name of function as string instead
    */
    constructor(engine, mapName) {
        this.reader = new WADReader(engine.wadFile);
        this.mapIndex = this.getLumpIndex(mapName);
        this.vertexes = this.getLumpData(
            "readVertex", //BUG1
            this.mapIndex + this.LUMP_INDICES.VERTEXES,
            4
        );
        this.linedefs = this.getLumpData(
            "readLinedef",
            this.mapIndex + this.LUMP_INDICES.LINEDEFS,
            14
        );
        this.nodes = this.getLumpData(
            "readNode",
            this.mapIndex + this.LUMP_INDICES.NODES,
            28
        );
        this.subSectors = this.getLumpData(
            "readSubSector",
            this.mapIndex + this.LUMP_INDICES.SSECTORS,
            4
        );
        this.segments = this.getLumpData(
            "readSegment",
            this.mapIndex + this.LUMP_INDICES.SEGS,
            12
        );
        this.things = this.getLumpData(
            "readThing",
            this.mapIndex + this.LUMP_INDICES.THINGS,
            10
        );
        this.sidedefs = this.getLumpData(
            "readSidedef",
            this.mapIndex + this.LUMP_INDICES.SIDEDEFS,
            30
        );
        this.sectors = this.getLumpData(
            "readSector",
            this.mapIndex + this.LUMP_INDICES.SECTORS,
            26
        )
        this.updateData();
        this.assetData = new AssetData(this);
    }

    updateData() {
        this.updateSidedefs();
        this.updateLinedefs();
        this.updateSegs();
    }

    updateSidedefs() {
        for (var sidedef of this.sidedefs) {
            sidedef.sector = this.sectors[sidedef.sectorId];
        }
    }

    updateLinedefs() {
        for (var linedef of this.linedefs) {
            linedef.frontSidedef = this.sidedefs[linedef.frontSidedefId];
            if (linedef.backSidedefId === 0xFFFF) {
                linedef.backSidedef = null;
            }
            else {
                linedef.backSidedef = this.sidedefs[linedef.backSidedefId];
            }
        }
    }

    updateSegs() {
        for (var seg of this.segments) {
            seg.startVertex = this.vertexes[seg.startVertexId];
            seg.endVertex = this.vertexes[seg.endVertexId];
            seg.linedef = this.linedefs[seg.linedefId];

            var frontSidedef;
            var backSidedef;
            if (seg.direction) {
                frontSidedef = seg.linedef.backSidedef;
                backSidedef = seg.linedef.frontSidedef;
            }
            else {
                frontSidedef = seg.linedef.frontSidedef;
                backSidedef = seg.linedef.backSidedef;
            }
            seg.frontSector = frontSidedef.sector;
            if (this.LINEDEF_FLAGS.TWO_SIDED & seg.linedef.flags) {
                seg.backSector = backSidedef.sector;
            }
            else {
                seg.backSector = null;
            }
            
            seg.angle = (seg.angle << 16) * 8.38190317e-8;
            if (seg.angle < 0) seg.angle += 360;
        }
    }

    printAttrs(obj) {
        var keys = Object.keys(obj);
        var printVals = new Array();
        for (var key of keys) {
            printVals.push(obj[key]);
        }
        console.log(printVals);
    }

    getLumpData(readerFuncName, lumpIndex, numBytes, headerLength = 0) {
        var lumpInfo = this.reader.directory[lumpIndex];
        var count = lumpInfo.lumpSize / numBytes; // DIVISION BY numBytes?????
        var data = new Array();

        for (var i = 0; i < count; i++) {
            var offset = lumpInfo.lumpOffset + i * numBytes + headerLength;
            data.push(this.reader[readerFuncName](offset));
        }
        return data;
    }

    getLumpIndex(lumpName) {
        var dir = this.reader.directory;        
        for (var i = 0; i < dir.length; i++) {
            var curEntry = dir[i];
            if (curEntry.lumpName === lumpName)
                return i;
        }
        return -1;
    }
}