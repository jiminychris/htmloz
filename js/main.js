$(document).ready(function() {
  canvas = $('#screen')[0];
  if (canvas.getContext) {
    main(canvas)
  } else {
    canvas.removeClass('hidden').addClass('visible');
  }
});
document.onkeydown = function(e) {
  changeKey((e||window.event).keyCode, 1);
}
document.onkeyup = function(e) {
  changeKey((e||window.event).keyCode, 0);
}
var canvas;
var ctx;
var imgData;
var tiles;
var tileSheet;
var defaultColors = [];
var palette = [];
var TILESIZE = 16;
var STARTMAP = 'map_ow_8-8.json';
//var STARTMAP = 'map_callista.json';

var key = {
  up: 0,
  down: 0,
  left: 0,
  right: 0
}
var phys = {
  dx: 0,
  dy: 0,
  x: 120,
  y: 80,
  hitbox: [
    {
      x: 0, 
      y: 8, 
      w: 16, 
      h: 8
    }
  ]
}
  
function main(canvas) {
  ctx = canvas.getContext('2d');
  
  new Parser(TILESIZE).parseFile('resources/maps/'+STARTMAP, function(data) {
    palette = data.palette;
    tiles = data.tiles;
    defaultColors = data.DEFAULT_COLORS;
    tileSheet = data.tileSheet;
    setInterval(loop, 35);
    //loop();
  });
  
  /*imgpreload(['art/inception.bmp'], function(images) {
    img = images[0];
    setInterval(loop, 35);
  });*/
};

function collides(a, b) {
  return !(a.x>=(b.x+b.w) || a.y>=(b.y+b.h) || b.x>=(a.x+a.w) || b.y>=(a.y+a.h));
}

function loop() {
  update();
  render();
};

var done = false;
var SPEED = 4;

function update() {
  phys.dx = 0;
  phys.dy = 0;
  if (key.up) phys.dy = -SPEED
  if (key.down) phys.dy = SPEED
  if (key.left) phys.dx = -SPEED
  if (key.right) phys.dx = SPEED
  
  phys.x += phys.dx;
  tiles.map(function(row) {
    row.map(function(tile) {
      if (tile.hitbox != null) {
        tile.hitbox.map(function(box) {
          phys.hitbox.map(function(pbox) {
            if (collides({x:box.x+tile.x, y:box.y+tile.y, w:box.w, h:box.h}, {x:pbox.x+phys.x, y:pbox.y+phys.y, w:pbox.w, h:pbox.h})) {
              if (phys.dx > 0) {
                phys.x = tile.x+box.x-pbox.w-pbox.x;
              }
              else if (phys.dx < 0) {
                phys.x = tile.x+box.w+box.x-pbox.x;
              }
            }
          });
        });
      }
    });
  });
  
  phys.y += phys.dy;
  tiles.map(function(row) {
    row.map(function(tile) {
      if (tile.hitbox != null) {
        tile.hitbox.map(function(box) {
          phys.hitbox.map(function(pbox) {
            if (collides({x:box.x+tile.x, y:box.y+tile.y, w:box.w, h:box.h}, {x:pbox.x+phys.x, y:pbox.y+phys.y, w:pbox.w, h:pbox.h})) {
              if (phys.dy > 0) {
                phys.y = tile.y+box.y-pbox.y-pbox.h;
              }
              else if (phys.dy < 0) {
                phys.y = tile.y+box.y+box.h-pbox.y;
              }
            }
          });
        });
      }
    });
  });
  
  done = true;
}

function fillBox(x,y,fill) {
  var fs = ctx.fillStyle;
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, TILESIZE, TILESIZE);
  ctx.fillStyle = fs;
}
function fillCircle(x,y,fore,back) {
  fillBox(x, y, back);
  var fs = ctx.fillStyle;
  ctx.fillStyle = fore;
  ctx.beginPath();
  ctx.arc(x+TILESIZE/2, y+TILESIZE/2, TILESIZE/2, 0, 2*Math.PI, false);
  ctx.fill();
  ctx.fillStyle = fs;
}
function fillTri(e,x,y,fore,back) {
  fillBox(x, y, back);
  var fs = ctx.fillStyle;
  ctx.fillStyle = fore;
  if (e === 0) {
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+TILESIZE, y);
    ctx.lineTo(x, y+TILESIZE);
    ctx.fill();
  }
  if (e === 1) {
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+TILESIZE, y);
    ctx.lineTo(x+TILESIZE, y+TILESIZE);
    ctx.fill();
  }
  if (e === 2) {
    ctx.beginPath();
    ctx.moveTo(x+TILESIZE,y+TILESIZE);
    ctx.lineTo(x+TILESIZE, y);
    ctx.lineTo(x, y+TILESIZE);
    ctx.fill();
  }
  if (e === 3) {
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+TILESIZE, y+TILESIZE);
    ctx.lineTo(x, y+TILESIZE);
    ctx.fill();
  }
  ctx.fillStyle = fs;
}

function render() {
  ctx.clearRect(0,0,canvas.width, canvas.height);
  tiles.map(function(row) {
    row.map(function(tile) {
      ctx.putImageData(tile.imgData, tile.x, tile.y);
    });
  });
  ctx.fillStyle = '#0f0';
  ctx.fillRect(phys.x, phys.y, 16, 16);
}

function changeKey(which, val) {
  switch (which) {
    case 87: case 38: key.up = val; break;
    case 83: case 40: key.down = val; break;
    case 65: case 37: key.left = val; break;
    case 68: case 39: key.right = val; break;
  }
}
