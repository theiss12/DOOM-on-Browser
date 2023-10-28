const DOOM_W = 320;
const DOOM_H = 200;
const DOOM_RES = [DOOM_W, DOOM_H];

var SCALE = 1;

var WIN_WIDTH = Math.floor(DOOM_W * SCALE);
var WIN_HEIGHT = Math.floor(DOOM_H * SCALE);
var WIN_RES = [WIN_WIDTH, WIN_HEIGHT];

var H_WIDTH = WIN_WIDTH / 2;
var H_HEIGHT = WIN_HEIGHT / 2;

const FOV = 90;
const H_FOV = FOV / 2;

const PLAYER_SPEED = 0.15;//0.3;
const PLAYER_ROT_SPEED = 0.12;
const PLAYER_HEIGHT = 41;

var SCREEN_DIST = H_WIDTH / Math.tan(H_FOV * Math.PI / 180);
const COLOR_KEY = new Color(152, 0, 136);