class TextureMap {
    constructor(
        name,
        flags,
        width,
        height,
        columnDir,
        patchCount,
        patchMaps = new Array()
    ) {
        this.name = name;
        this.flags = flags;
        this.width = width;
        this.height = height;
        this.columnDir = columnDir;
        this.patchCount = patchCount;
        this.patchMaps = patchMaps;
    }
}

class PatchMap {
    constructor(
        xOffset,
        yOffset,
        pNameIndex,
        stepDir,
        colorMap
    ) {
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.pNameIndex = pNameIndex;
        this.stepDir = stepDir;
        this.colorMap = colorMap;
    }
}

class TextureHeader {
    constructor(textureCount, textureOffset, textureDataOffset = new Array()) {
        this.textureCount = textureCount;
        this.textureOffset = textureOffset;
        this.textureDataOffset = textureDataOffset;
    }
}

class PatchColumn {
    constructor(topDelta, length, paddingPre, data, paddingPost) {
        this.topDelta = topDelta;
        this.length = length;
        this.paddingPre = paddingPre;
        this.data = data;
        this.paddingPost = paddingPost;
    }
}

class PatchHeader {
    constructor(width, height, leftOffset, topOffset, columnOffset) {
        this.width = width;
        this.height = height;
        this.leftOffset = leftOffset;
        this.topOffset = topOffset;
        this.columnOffset = columnOffset;
    }
}

class Thing {
    constructor(
        pos, // vec2(x,y)
        angle,
        type,
        flags
    ) {
        this.pos = pos;
        this.angle = angle;
        this.type = type;
        this.flags = flags;
    }
}

class Seg {
    constructor(
        startVertexId,
        endVertexId,
        angle,
        linedefId,
        direction,
        offset
    ) {
        this.startVertexId = startVertexId
        this.endVertexId   = endVertexId
        this.angle         = angle
        this.linedefId     = linedefId
        this.direction     = direction
        this.offset        = offset

        this.startVertex = null;
        this.endVertex = null;
        this.linedef = null;
        this.frontSector = null;
        this.backSector = null;
    }
}

class SubSector {
    constructor(segCount, firstSegId) {
        this.segCount = segCount;
        this.firstSegId = firstSegId;
    }
}

class Node {

    constructor(
        /*xPartition,
        yPartition,
        dxPartition,
        dyPartition,
        bbox,
        frontChildId,
        backChildId*/
    ) {
        this.xPartition   = undefined;
        this.yPartition   = undefined;
        this.dxPartition  = undefined;
        this.dyPartition  = undefined;
        this.bbox         = {
            front: new BBox(),
            back: new BBox()
        };
        this.frontChildId = undefined;
        this.backChildId  = undefined;
    }
}

class BBox {
    constructor (top, bottom, left, right) {
        this.top = top;
        this.bottom = bottom;
        this.left = left;
        this.right = right;
    }
}

class Linedef {
    constructor(
        startVertexId,
        endVertexId,
        flags,
        lineType,
        sectorTag,
        frontSidedefId,
        backSidedefId
    ) {
        this.startVertexId  = startVertexId;
        this.endVertexId    = endVertexId;
        this.flags          = flags;
        this.lineType       = lineType;
        this.sectorTag      = sectorTag;
        this.frontSidedefId = frontSidedefId;
        this.backSidedefId  = backSidedefId;

        this.frontSidedef = null;
        this.backSidedef = null;
    }
}

class Sector {
    constructor(
        floorHeight,
        ceilHeight,
        floorTexture,
        ceilTexture,
        lightLevel,
        type,
        tag
    ) {
        this.floorHeight = floorHeight;
        this.ceilHeight = ceilHeight;
        this.floorTexture = floorTexture;
        this.ceilTexture = ceilTexture;
        this.lightLevel = lightLevel;
        this.type = type;
        this.tag = tag;
    }
}

class Sidedef {
    constructor(
        xOffset,
        yOffset,
        upperTexture,
        lowerTexture,
        middleTexture,
        sectorId
    ) {
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.upperTexture = upperTexture;
        this.lowerTexture = lowerTexture;
        this.middleTexture = middleTexture;
        this.sectorId = sectorId;

        this.sector = null;
    }
}