class MapRenderer {
    constructor(engine) {
        this.engine = engine;
        this.wadData = engine.wadData;
        this.vertexes = this.wadData.vertexes;
        this.linedefs = this.wadData.linedefs;
        this.bounds = this.getMapBounds();
        this.vertexes = this.remap(this.vertexes);
    }

    draw() {
        //this.drawLinedefs();
        //this.drawPlayerPos();
    }

    remap(rawVertexes) {
        var remappedVertexes = new Array();
        for (var raw of rawVertexes) {
            var remapped = new vec2(
                this.remapX(raw.x/*, 30, Drawer.canv.width - 30*/),
                this.remapY(raw.y/*, 0, Drawer.canv.height*/)
            );
            remappedVertexes.push(remapped);
        }
        return remappedVertexes;
    }

    remapX(n, outMin = /*30*/0, outMax = Drawer.canv.width - /*30*/0) {
        var val1 = Math.max(this.bounds.min.x, Math.min(n, this.bounds.max.x)) - this.bounds.min.x;
        var val2 = outMax - outMin;
        var val3 = this.bounds.max.x - this.bounds.min.x;
        return val1 * val2 / val3 + outMin;
    }

    remapY(n, outMin = 0/*30*/, outMax = Drawer.canv.height - 0/*30*/) {
        var val1 = Math.max(this.bounds.min.y, Math.min(n, this.bounds.max.y)) - this.bounds.min.y;
        var val2 = outMax - outMin;
        var val3 = this.bounds.max.y - this.bounds.min.y;
        return Drawer.canv.height - val1 * val2 / val3 + outMin; 
    }

    getMapBounds() {
        var vsX = JSON.parse(JSON.stringify(this.vertexes));
        var sortedX = vsX.sort(function(a, b) {
            if (a.x < b.x) return -1;
            if (a.x > b.x) return 1;
            return 0;
        });
        
        var vsY = JSON.parse(JSON.stringify(this.vertexes));
        var sortedY = vsY.sort(function(a, b) {
            if (a.y < b.y) return -1;
            if (a.y > b.y) return 1;
            return 0;
        });

        var last = this.vertexes.length - 1;
        var bounds = {
            min: {x: sortedX[0].x, y: sortedY[0].y},
            max: {x: sortedX[last].x, y: sortedY[last].y}
        };

        return bounds;
    }

    drawLinedefs() {
        for (var ld of this.linedefs) {
            var p1 = this.vertexes[ld.startVertexId];
            var p2 = this.vertexes[ld.endVertexId];
            Drawer.line(p1, p2, "red", 1);
        }
    }

    drawVerticalLines(x1, x2, subSectorId) {
        var color = Color.randColors[subSectorId];
        var vt1 = new vec2(x1, 0);
        var vb1 = new vec2(x1, WIN_HEIGHT);
        var vt2 = new vec2(x2, 0);
        var vb2 = new vec2(x2, WIN_HEIGHT);
        Drawer.line(vt1, vb1, color.getStyleRGB(), 3);
        Drawer.line(vt2, vb2, color.getStyleRGB(), 3);
    }

    drawSeg(seg, subSectorId) {
        var v1 = this.vertexes[seg.startVertexId];
        var v2 = this.vertexes[seg.endVertexId];
        //var color = Color.randColors[subSectorId];
        Drawer.line(v1, v2, "green"/*color.getStyleRGB()*/, 2);
    }

    drawFov(px, py) {
        var x = this.engine.player.pos.x;
        var y = this.engine.player.pos.y;
        var angle = -this.engine.player.angle + 90;
        var sinA1 = Math.sin(this.engine.degToRad(angle - H_FOV))
        var cosA1 = Math.cos(this.engine.degToRad(angle - H_FOV))
        var sinA2 = Math.sin(this.engine.degToRad(angle + H_FOV))
        var cosA2 = Math.cos(this.engine.degToRad(angle + H_FOV))
        var lenRay = WIN_HEIGHT;

        var x1 = this.remapX(x + lenRay * sinA1);
        var y1 = this.remapY(y + lenRay * cosA1);
        var x2 = this.remapX(x + lenRay * sinA2);
        var y2 = this.remapY(y + lenRay * cosA2);
        Drawer.line(new vec2(px, py), new vec2(x1, y1),"yellow", 2);
        Drawer.line(new vec2(px, py), new vec2(x2, y2),"yellow", 2);        
    }

    drawBbox(bbox, style) {
        var x = this.remapX(bbox.left);
        var y = this.remapY(bbox.top);
        var w = this.remapX(bbox.right);
        var h = this.remapY(bbox.bottom);
        Drawer.rect(x, y, w, h, style);
    }

    drawNode(nodeId) {
        var node = this.engine.wadData.nodes[nodeId];
        var bboxFront = node.bbox.front;
        var bboxBack = node.bbox.back;
        this.drawBbox(bboxFront, "green");
        this.drawBbox(bboxBack, "red");

        var x1 = this.remapX(node.xPartition)
        var y1 = this.remapY(node.yPartition)
        var x2 = this.remapX(node.xPartition + node.dxPartition);
        var y2 = this.remapY(node.yPartition + node.dyPartition);
        var p1 = new vec2(x1, y1);
        var p2 = new vec2(x2, y2);
        Drawer.line(p1, p2, "blue", 3);
    }

    drawPlayerPos() {
        var pos = this.engine.player.pos;
        var x = this.remapX(pos.x);
        var y = this.remapY(pos.y);
        this.drawFov(x, y);
        Drawer.circle(x, y, 4, "orange", "orange");
    }

    drawVertexes() {
        for (var v of this.vertexes) {
            Drawer.circle(v.x, v.y, 4, "red", "black");
        }
    }
}