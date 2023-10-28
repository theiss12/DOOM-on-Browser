class CanvasDrawer {
  constructor(canvasId) {
    this.canv = document.getElementById(canvasId);
    this.ctx = this.canv.getContext("2d", {willReadFrequently: true});
    //this.mainCtx.imageSmoothingEnabled = true;
    this.buffer = undefined;
    this.setBuffer();
  }

  setBuffer() {
    this.buffer = this.ctx.createImageData(this.canv.width, this.canv.height);
    this.clear();
  }

  pixel(x, y, col) {
    if (
      x < 0 ||
      x >= this.canv.width ||
      y < 0 ||
      y >= this.canv.height) {
      return;
    }
    var index = 4 * (this.canv.width * Math.floor(y) + Math.floor(x));
    var data = this.buffer.data;
    data[index]     = col.r;
    data[index + 1] = col.g;
    data[index + 2] = col.b;
    //data[index + 3] = 255;
  }

  clear() {
    for (var i = 0; i < this.buffer.data.length; i++) {
      this.buffer.data[i] = 255;
    }
  }

  swap() {
    this.ctx.putImageData(this.buffer, 0, 0);
  }

  circle(x, y, r, fill, outline) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = outline;
    this.ctx.fill();
    this.ctx.stroke();
  }

  line(p1, p2, style, width) {
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.strokeStyle = style;
    this.ctx.lineWidth = width;
    this.ctx.stroke();
  }

  verticalLine(x, y1, y2, style) {
    this.ctx.fillStyle = style;
    this.ctx.fillRect(x, y1, 1, y2 - y1);
  }

  rect(x, y, w, h, style) {
    this.ctx.fillStyle = style;
    this.ctx.fillRect(x, y, w, h);
  }
}

const Drawer = new CanvasDrawer("screen");