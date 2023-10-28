class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.style = this.getStyleRGB();
    }

    getStyleRGB() {
        var rgb = `rgb(${this.r},${this.g},${this.b})`;
        return rgb;
    }
}

Color.randColors = new Array(1000);

Color.initRandColors = function() {
    for (var i = 0; i < this.randColors.length; i++) {
        this.randColors[i] = this.getRandom();
    }
};

Color.randInt = function(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
};

Color.getRandom = function() {
    const r = this.randInt(0, 255);
    const g = this.randInt(0, 255);
    const b = this.randInt(0, 255);
    return new Color(r, g, b);
}

Color.initRandColors();