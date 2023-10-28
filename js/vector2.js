class vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    rotate(degrees) {
        var angle = degrees * (Math.PI/180);
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var rotX = Math.round(10000*(this.x * cos - this.y * sin))/10000;
        var rotY = Math.round(10000*(this.x * sin + this.y * cos))/10000;
        this.x = rotX;
        this.y = rotY;
    }

    plusEquals(other) {
        this.x += other.x;
        this.y += other.y;
    }

    multiplyEquals(n) {
        this.x *= n;
        this.y *= n;
    }

    minus(other) {
        return new vec2(this.x - other.x, this.y - other.y);
    }
}

var rotateVector = function(vec, ang)
{
    ang = -ang * (Math.PI/180);
    var cos = Math.cos(ang);
    var sin = Math.sin(ang);
    return new Array(Math.round(10000*(vec[0] * cos - vec[1] * sin))/10000, Math.round(10000*(vec[0] * sin + vec[1] * cos))/10000);
};