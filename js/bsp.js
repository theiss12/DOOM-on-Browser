class BSP {
    SUB_SECTOR_IDENTIFIER = 0x8000; // 2**15 = 32768

    constructor(engine) {
        this.engine = engine;
        this.player = engine.player;
        this.nodes = engine.wadData.nodes;
        this.subSectors = engine.wadData.subSectors;
        this.segs = engine.wadData.segments;
        this.rootNodeId = this.nodes.length - 1;
        this.isTraverseBsp = true;
    }

    update() {
        this.isTraverseBsp = true;
        this.renderBspNode(this.rootNodeId);
    }

    getSubSectorHeight() {
        var subSectorId = this.rootNodeId;

        while (!subSectorId >= this.SUB_SECTOR_IDENTIFIER) {
            var node = this.nodes[subSectorId]

            var isOnBack = this.isOnBackSide(node)
            if (isOnBack) subSectorId = this.nodes[subSectorId].backChildId;
            else subSectorId = this.nodes[subSectorId].frontChildId;
        }
        var subSectorIndex = subSectorId - this.SUB_SECTOR_IDENTIFIER;
        if (subSectorIndex < 0) {
            var numSectors = this.subSectors.length;
            var overshoot = (Math.floor(subSectorIndex / numSectors)) * numSectors;
            var normalIndex = subSectorIndex - overshoot;
            var positiveIndex = numSectors - normalIndex;
            
            subSectorIndex = positiveIndex;
        }
        var subSector = this.subSectors[subSectorIndex];
        var seg = this.segs[subSector.firstSegId];
        return seg.frontSector.floorHeight;
    }

    angleToX(angle) {
        var x;
        if (angle > 0) {
            x = SCREEN_DIST - Math.tan(this.engine.degToRad(angle)) * H_WIDTH;
        }
        else {
            x = -Math.tan(this.engine.degToRad(angle)) * H_WIDTH + SCREEN_DIST;
        }
        return Math.floor(x);
    }

    addSegmentToFov(vertex1, vertex2) {
        var angle1 = this.pointToAngle(vertex1);
        var angle2 = this.pointToAngle(vertex2);

        var span = this.norm(angle1 - angle2);
        if (span >= 180) return false;

        var rwAngle1 = angle1;

        angle1 -= this.player.angle;
        angle2 -= this.player.angle;

        var span1 = this.norm(angle1 + H_FOV);
        if (span1 > FOV) {
            if (span1 >= span + FOV) {
                return false;
            }
            angle1 = H_FOV;
        }

        var span2 = this.norm(H_FOV - angle2);
        if (span2 > FOV) {
            if (span2 >= span + FOV) {
                return false;
            }
            angle2 = -H_FOV;
        }
        var x1 = this.angleToX(angle1);
        var x2 = this.angleToX(angle2);
        return [x1, x2, rwAngle1];
    }

    renderSubSector(subSectorId) {
        var subSector = this.subSectors[subSectorId];

        for (var i = 0; i < subSector.segCount; i++) {
            let seg = this.segs[subSector.firstSegId + i];
            var result = this.addSegmentToFov(seg.startVertex, seg.endVertex);
            if (result) {
                //this.engine.mapRenderer.drawSeg(seg, subSectorId);
                //this.engine.mapRenderer.drawVerticalLines(result[0], result[1], subSectorId); // swapped for classifySegment at 3:27
                /*SEGMENTS ENDING UP HERE, ARE THE ONES IN FOV*/
                this.engine.segHandler.classifySegment(seg, ...result/*result[0], result[1], result[2]*/);
            }
        }
    }

    norm(angle) {
        angle %= 360;
        if (angle < 0) return angle + 360;
        else return angle;

        /*if (angle > 360) return angle - 360;
        if (angle < 0) return angle + 360;
        return angle;*/
    }

    checkBbox(bbox) {
        var a = new vec2(bbox.left, bbox.bottom);
        var b = new vec2(bbox.left, bbox.top);
        var c = new vec2(bbox.right, bbox.top);
        var d = new vec2(bbox.right, bbox.bottom);
        var px = this.player.pos.x;
        var py = this.player.pos.y;
        var bboxSides;
        if (px < bbox.left) {
            if (py > bbox.top) {
                bboxSides = [[b, a], [c, b]];
            }
            else if (py < bbox.bottom) {
                bboxSides = [[b, a], [a, d]];
            }
            else {
                bboxSides = [[b, a]];
            }
        }
        else if (px > bbox.right) {
            if (py > bbox.top) {
                bboxSides = [[c, b], [d, c]];
            }
            else if (py < bbox.bottom) {
                bboxSides = [[a, d], [d, c]];
            }
            else {
                bboxSides = [[d, c]];
            }
        }
        else {
            if (py > bbox.top) {
                bboxSides = [[c, b]];
            }
            else if (py < bbox.bottom) {
                bboxSides = [[a, d]];
            }
            else return true;
        }

        for (var vs of bboxSides) {
            var v1 = vs[0];
            var v2 = vs[1];
            var angle1 = this.pointToAngle(v1);
            var angle2 = this.pointToAngle(v2);
            var span = this.norm(angle1 - angle2);
            angle1 -= this.player.angle;
            var span1 = this.norm(angle1 + H_FOV);
            if (span1 > FOV) {
                if (span1 >= span + FOV) {
                    continue;
                }
            }
            return true;
        }
        return false;
    }

    pointToAngle(vertex) {
        var delta = vertex.minus(this.player.pos);
        var rad = Math.atan2(delta.y, delta.x);
        return this.engine.radToDeg(rad);
    }

    renderBspNode(nodeId) {
        if (this.isTraverseBsp) {
            if (nodeId >= this.SUB_SECTOR_IDENTIFIER) {
                var subSectorId = nodeId - this.SUB_SECTOR_IDENTIFIER;
                this.renderSubSector(subSectorId);
                return undefined;
            }

            var node = this.nodes[nodeId];

            var isOnBack = this.isOnBackSide(node);
            if (isOnBack) {
                this.renderBspNode(node.backChildId);
                if (this.checkBbox(node.bbox.front)) {
                    this.renderBspNode(node.frontChildId);
                }
            }
            else {
                this.renderBspNode(node.frontChildId);
                if (this.checkBbox(node.bbox.back)) {
                    this.renderBspNode(node.backChildId);
                }
            }
        }
    }

    isOnBackSide(node) {
        var dx = this.player.pos.x - node.xPartition;
        var dy = this.player.pos.y - node.yPartition;
        return dx * node.dyPartition - dy * node.dxPartition <= 0;
    }
}