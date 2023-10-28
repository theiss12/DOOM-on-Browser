class WADReader {

    constructor(wadFile) {
        this.wadFile = wadFile;
        this.header = this.readHeader();
        this.directory = this.readDirectory();
        
    }

    printDirectory() {
        for (var entry of this.directory) {
            console.log(entry);
        }
    }

    readHeader() {
        return {
            wadType: this.readString(0, 4),
            lumpCount: this.read4Bytes(4, undefined),
            initOffset: this.read4Bytes(8, undefined)
        }
    }

    readThing(offset) {
        var thing = new Thing(
            new vec2(
                this.read2Bytes(offset),
                this.read2Bytes(offset + 2)
            ),
            this.read2BytesUnsigned(offset + 4),
            this.read2BytesUnsigned(offset + 6),
            this.read2BytesUnsigned(offset + 8)
        );
        return thing;
    }

    readSegment(offset) {
        var seg = new Seg(
            this.read2Bytes(offset),
            this.read2Bytes(offset + 2),
            this.read2Bytes(offset + 4),
            this.read2Bytes(offset + 6),
            this.read2Bytes(offset + 8),
            this.read2Bytes(offset + 10),
        );
        return seg;
    }

    readSubSector(offset) {
        var subSector = new SubSector(
            this.read2Bytes(offset),
            this.read2Bytes(offset + 2)
        );
        return subSector;
    }

    readNode(offset) {
        var node = new Node();

        node.xPartition  = this.read2Bytes(offset + 0);
        node.yPartition  = this.read2Bytes(offset + 2);
        node.dxPartition = this.read2Bytes(offset + 4);
        node.dyPartition = this.read2Bytes(offset + 6);
        
        node.bbox.front.top    = this.read2Bytes(offset + 8);
        node.bbox.front.bottom = this.read2Bytes(offset + 10);
        node.bbox.front.left   = this.read2Bytes(offset + 12);
        node.bbox.front.right  = this.read2Bytes(offset + 14);

        node.bbox.back.top    = this.read2Bytes(offset + 16);
        node.bbox.back.bottom = this.read2Bytes(offset + 18);
        node.bbox.back.left   = this.read2Bytes(offset + 20);
        node.bbox.back.right  = this.read2Bytes(offset + 22);

        node.frontChildId = this.read2BytesUnsigned(offset + 24);
        node.backChildId  = this.read2BytesUnsigned(offset + 26);
        return node;
    }

    readLinedef(offset) {
        var linedef = new Linedef(
            this.read2BytesUnsigned(offset +  0),
            this.read2BytesUnsigned(offset +  2),
            this.read2BytesUnsigned(offset +  4),
            this.read2BytesUnsigned(offset +  6),
            this.read2BytesUnsigned(offset +  8),
            this.read2BytesUnsigned(offset + 10),
            this.read2BytesUnsigned(offset + 12) //this.read2Bytes(offset + 12, undefined)
        );
        return linedef;
    }

    readVertex(offset) {
        var x = this.read2Bytes(offset, undefined);
        var y = this.read2Bytes(offset + 2, undefined);
        return new vec2(x, y);
    }

    readTextureMap(offset) {
        var texMap = new TextureMap(
            this.readString(offset + 0, 8),
            this.read4BytesUnsigned(offset + 8),
            this.read2BytesUnsigned(offset + 12),
            this.read2BytesUnsigned(offset + 14),
            this.read4BytesUnsigned(offset + 16),
            this.read2BytesUnsigned(offset + 20)
        );
        for (var i = 0; i < texMap.patchCount; i++) {
            var patchMap = this.readPatchMap(offset + 22 + i * 10);
            texMap.patchMaps.push(patchMap);
        }
        return texMap;
    }

    readPatchMap(offset) {
        var patchMap = new PatchMap(
            this.read2Bytes(offset + 0),
            this.read2Bytes(offset + 2),
            this.read2BytesUnsigned(offset + 4),
            this.read2BytesUnsigned(offset + 6),
            this.read2BytesUnsigned(offset + 8)
        );
        return patchMap;
    }

    readTextureHeader(offset) {
        var texHeader = new TextureHeader(
            this.read4BytesUnsigned(offset + 0),
            this.read2BytesUnsigned(offset + 4)
        );
        for (var i = 0; i < texHeader.textureCount; i++) {
            var tdo = this.read4BytesUnsigned(offset + 4 + i * 4);
            texHeader.textureDataOffset.push(tdo);
        }
        return texHeader;
    }

    readPatchColumn(offset) {
        var patchColumn = new PatchColumn();
        patchColumn.topDelta = this.read1ByteUnsigned(offset + 0);
        if (patchColumn.topDelta !== 0xff) {
            patchColumn.length = this.read1ByteUnsigned(offset + 1);
            patchColumn.paddingPre = this.read1ByteUnsigned(offset + 2); // unused
            patchColumn.data = new Array();
            for (var i = 0; i < patchColumn.length; i++) {
                patchColumn.data.push(this.read1ByteUnsigned(offset + 3 + i));
            }
            patchColumn.paddingPost = this.read1ByteUnsigned(offset + 3 + patchColumn.length); // unsued
            return {pc: patchColumn, offs: offset + 4 + patchColumn.length}
        }
        return {pc: patchColumn, offs: offset + 1};
    }

    readPatchHeader(offset) {
        var width = this.read2BytesUnsigned(offset + 0)
        var columnOffset = new Array();
        for (var i = 0; i < width; i++) {
            columnOffset.push(this.read4BytesUnsigned(offset + 8 + 4 * i))
        }
        var patchHeader = new PatchHeader(
            width,
            this.read2BytesUnsigned(offset + 2),
            this.read2Bytes(offset + 4),
            this.read2Bytes(offset + 6),
            columnOffset
        );
        return patchHeader;
    }

    readPalette(offset) {
        var palette = new Array();
        for (var i = 0; i < 256; i++) {
            var r = this.read1ByteUnsigned(offset + i * 3 + 0);
            var g = this.read1ByteUnsigned(offset + i * 3 + 1);
            var b = this.read1ByteUnsigned(offset + i * 3 + 2);
            palette.push(new Color(r, g, b));
        }
        return palette;
    }

    readSector(offset) {
        var sector = new Sector(
            this.read2Bytes(offset),
            this.read2Bytes(offset + 2),

            this.readString(offset + 4, 8),
            this.readString(offset + 12, 8),

            this.read2BytesUnsigned(offset + 20),
            this.read2BytesUnsigned(offset + 22),
            this.read2BytesUnsigned(offset + 24)
        );
        return sector;
    }

    readSidedef(offset) {
        var sidedef = new Sidedef(
            this.read2Bytes(offset),
            this.read2Bytes(offset + 2),

            this.readString(offset + 4, 8),//.toUpperCase(),
            this.readString(offset + 12, 8),//.toUpperCase(),
            this.readString(offset + 20, 8),//.toUpperCase(),

            this.read2BytesUnsigned(offset + 28)
        );
        return sidedef;
    }

    readDirectory() {
        var directory = new Array();
        for (var i = 0; i < this.header.lumpCount; i++) {
            var offset = this.header.initOffset + i * 16;
            var lumpInfo = {
                lumpOffset: this.read4Bytes(offset, undefined),
                lumpSize: this.read4Bytes(offset + 4),
                lumpName: this.readString(offset + 8, 8)
            }
            directory.push(lumpInfo);
        }
        return directory;
    }

    readBytes(offset, numBytes, byteFormat) {
        var dv = new DataView(this.wadFile, offset, numBytes);
        return dv;
    }

    readString(offset, numBytes = 8) {
        //String.fromCharCode()
        var max = offset + numBytes;
        var str = "";
        for (var i = offset; i < max; i++) {
            var dv = this.readBytes(i, 1, undefined);
            var charCode = dv.getInt8(0);
            if (charCode < 32) continue; // ???
            var char = String.fromCharCode(charCode);
            // char = char.toUpperCase(); // ??
            str += char;
        }
        return str;
    }

    read1Byte(offset, byteFormat) { //BUGGY getInt32 also!!
        var dv = this.readBytes(offset, 1, undefined);
        var reading = dv.getInt8(0);
        return reading;
    }

    read1ByteUnsigned(offset, byteFormat) { //BUGGY getInt32 also!!
        var dv = this.readBytes(offset, 1, undefined);
        var reading = dv.getUint8(0);
        return reading;
    }

    read2Bytes(offset, byteFormat) {
        var dv = this.readBytes(offset, 2, undefined);
        var littleEndian = true;
        //!!!!! var reading = dv.getUint16(0, littleEndian);
        var reading = dv.getInt16(0, littleEndian); //dv.getInt32(0, littleEndian); // BUG: cant read 2 bytes using getInt32
        return reading;
    }

    read2BytesUnsigned(offset) {
        var dv = this.readBytes(offset, 2, undefined);
        var littleEndian = true;
        //var reading = dv.getInt16(0, littleEndian); //dv.getInt32(0, littleEndian); // BUG: cant read 2 bytes using getInt32
        var reading = dv.getUint16(0, littleEndian);
        return reading;
    }

    read4Bytes(offset, byteFormat) {
        var dv = this.readBytes(offset, 4, undefined);
        var littleEndian = true;
        var reading = dv.getInt32(0, littleEndian);
        return reading;
    }

    read4BytesUnsigned(offset) {
        var dv = this.readBytes(offset, 4, undefined);
        var littleEndian = true;
        var reading = dv.getUint32(0, littleEndian);
        return reading;
    }
}