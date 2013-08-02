$(document).ready(function() {
  canvas = $('#screen')[0];
  if (canvas.getContext) {
    main(canvas)
  } else {
    canvas.removeClass('hidden').addClass('visible');
  }
});
var canvas;
var ctx;
var thickness = 2;
var tiles;
var tileSheet;
var tilesFile;
var colorData;
var colorPickers = [];
var palette = [];
var glow = 'rgba(255,255,0,0)'
var tileDefs;
var isDragging = false;
var mostRecentTileCoordinates = {x:0, y:0};
var selectedTilesCoordinates = [mostRecentTileCoordinates];
var mostRecentTileName = "";
var contextMenu;
var tileButtons = [];
var TILESIZE = 16;

function coordinateInArray(value, array) {
  for (var i = 0; i < array.length; i++) {
    if (value.x == array[i].x && value.y == array[i].y) return i;
  }
  return -1;
}

function load(json) {
}

function changeSelectedTilesType(type) {
  selectedTilesCoordinates.map(function(c) {
    tiles[c.y][c.x] = {
      x:tiles[c.y][c.x].x,
      y:tiles[c.y][c.x].y,
      type:type,
      slice:colorData[type].slice,
      hitbox:colorData[type].hitbox,
      imgData:colorData[type].imgData
    };
    
    render();
  });
}
function refreshColors() {
  tiles.map(function(row, j) {
    row.map(function (tile, i) {
      tiles[j][i].imgData = colorData[tile.type].imgData;
    });
  });
  tileButtons.map(function(btn, i) {
    tileButtons[i].getContext('2d').putImageData(colorData[btn.getAttribute('data-type')].imgData, 0, 0);
  });
}
function arrowKeySelect(e, i) {
  if (inTileRange(i)) {
    mostRecentTileCoordinates = i;
    if (e.shiftKey) {
      if (coordinateInArray(i, selectedTilesCoordinates) == -1) {
        selectedTilesCoordinates.push(i)
      }
    }
    else {
      selectedTilesCoordinates = [i];
    }
    render();
  }
}

var keyframe = 0;
function animate() {
  var max = 60;
  var a;
  
  if (keyframe > max/2) a = 1-keyframe/(max)
  else a = keyframe/(max);
  
  glow = 'rgba(255,255,0,'+a.toString()+')';
  
  keyframe++;
  if (keyframe == max) keyframe = 0;
  render();
}

function main(canvas) {
  function getTileIndex(e) {
    var x = Math.floor((e.pageX-$(canvas).offset().left) / TILESIZE);
    var y = Math.floor((e.pageY-$(canvas).offset().top) / TILESIZE);
    var i = {x:x, y:y};
    
    if (!inTileRange(i)) {
      i = null;
    }
    return i;
  }
  ctx = canvas.getContext('2d');
  
  var p = new Parser(TILESIZE);
  p.parseFile('resources/maps/map_default.json', function(data) {
    tiles = data.tiles;
    tilesFile = data.tilesFile;
    tileSheet = data.tileSheet;
    tileDefs = data.tileDefs;
    palette = data.palette;
    
    p.colorAllDefinitions(tilesFile, palette, function(cd) {
      colorData = cd;

      contextMenu = $('<div id="contextmenu"></div>');    
      contextMenu.width('128px');
      contextMenu.height('128px');
      contextMenu.hide();
      $('body').append(contextMenu);
    
      tileButtons = tileDefs.map(function(def) {
        var btn = document.createElement('canvas');
        btn.width = TILESIZE;
        btn.height = TILESIZE;
        $(btn).addClass('tile-selector');
        btn.setAttribute('data-type', def.name);
        var context = btn.getContext('2d');
        context.putImageData(colorData[def.name].imgData, 0, 0);
        $(btn).click(function(e) {
          changeSelectedTilesType(def.name);
          mostRecentTileName = def.name;
        });
        return btn;
      });
    
      tileButtons.map(function(btn) {
        contextMenu.append(btn);
      });
    });
    
    if (tileDefs.length == 0) {
      throw new TypeError('there are zero tile definitions');
    }
    mostRecentTileName = tileDefs[0].name;
    
    
    $('#save').click(function(e) {
      var t = tiles.map(function(row) {
        return row.map(function(tile) {
          return {type: tile.type};
        });
      });
      $('#output').val(JSON.stringify({palette:palette, tiles_file: tilesFile, tiles:t}));
    });
    $('#load').click(function(e) {
      var json = eval('('+$('#output').val()+')');
      var p = new Parser(TILESIZE);
      p.parse(json, function(data) {
        tiles = data.tiles;
        tilesFile = data.tilesFile;
        tileSheet = data.tileSheet;
        tileDefs = data.tileDefs;
        palette = data.palette;
        p.colorAllDefinitions(tilesFile, palette, function(cd) {
          colorPickers.map(function (cpkr, i) {
            console.log(i, cpkr);
            $(cpkr).ColorPickerSetColor(palette[i]);
            $($('#colorpickers > div')[i]).css('background', palette[i]);
          });
          colorData = cd;
          refreshColors();
          render();
        });
      });
    });
    palette.map(function(p, i) {
      var input = $('<div></div>');
      input.height('16px');
      input.width('16px');
      input.css('background', p);
      function changeBG(hex) {
        input.css('background', hex);
      }
      input.ColorPicker({color:p, onSubmit: function(hsb, hex, rgb, el) {
        hex = '#'+hex;
        changeBG(hex);
        palette[i] = hex;
        new Parser(TILESIZE).colorAllDefinitions(tilesFile, palette, function(cd) {
          colorData = cd;
          refreshColors();
          render();
        });
        $(el).ColorPickerHide();
      }, onChange: function(hsb, hex, rgb, el) {
        changeBG('#'+hex);
      }, onHide: function(colpkr) {
        changeBG(palette[i]);
      }});
      colorPickers[i] = input;
      $('#colorpickers').append(input);
    });
  
    $(canvas).on('contextmenu', function(e) {
      if (contextMenu.css('display') != 'none') {
        contextMenu.hide();
      }
      contextMenu.css('top', e.pageY+4);
      contextMenu.css('left', e.pageX-4);
      contextMenu.show();
      return false;
    });
    
    setInterval(animate, 35);
    
    document.onkeydown = function(e) {
      switch (e.keyCode) {
        case 38: // up
          var i = {x: mostRecentTileCoordinates.x, y: mostRecentTileCoordinates.y - 1};
          arrowKeySelect(e, i);
          break;
        case 40: // down
          var i = {x: mostRecentTileCoordinates.x, y: mostRecentTileCoordinates.y + 1};
          arrowKeySelect(e, i);
          break;
        case 37: // left
          var i = {x: mostRecentTileCoordinates.x - 1, y: mostRecentTileCoordinates.y};
          arrowKeySelect(e, i);
          break;
        case 39: // right
          var i = {x: mostRecentTileCoordinates.x + 1, y: mostRecentTileCoordinates.y};
          arrowKeySelect(e, i);
          break;
        case 32: // space
          changeSelectedTilesType(mostRecentTileName);
          break;
        /*case 13: // enter
          changeSelectedTilesType('wall');
          break;
        case 49: // 1
          changeSelectedTilesType('top_left_corner');
          break;
        case 50: // 2
          changeSelectedTilesType('top_right_corner');
          break;
        case 51: // 3
          changeSelectedTilesType('bottom_right_corner');
          break;
        case 52: // 4
          changeSelectedTilesType('bottom_left_corner');
          break;*/
      }
    }
    document.onkeyup = function(e) {
    }
    
    $(canvas).mousedown(function(e) {
      switch (e.which) {
        case 1:
          if (contextMenu.css('display') != 'none') {
            contextMenu.hide();
          }
          i = getTileIndex(e);
          if (i != null) {
            mostRecentTileCoordinates = i;
            if (e.metaKey || e.ctrlKey) {
              var inArray = coordinateInArray(i, selectedTilesCoordinates);
              if (inArray != -1 && selectedTilesCoordinates.length != 1) {
                selectedTilesCoordinates.splice(inArray, 1);
              }
              else if (inArray == -1) {
                selectedTilesCoordinates.push(i);
              }
            }
            else {
              selectedTilesCoordinates = [i];
            }
            render();
          }
          isDragging = true;
          break;
          
        case 2:
          break;
        case 3:
          break;
      }
      
    });
    $(canvas).mouseup(function(e) {
      if (e.which == 1) {
        isDragging = false;
      }
    });
    $(canvas).mousemove(function(e) {
      if (isDragging) {
        i = getTileIndex(e);
        if (i != null) {
          mostRecentTileCoordinates = i;
          if (coordinateInArray(i, selectedTilesCoordinates) == -1)
          {
            selectedTilesCoordinates.push(i);
          }
        }
        render();
      }
    });
    render();
  });
};

function fillBox(x,y,fill) {
  var fs = ctx.fillStyle;
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, TILESIZE, TILESIZE);
  ctx.fillStyle = fs;
}
function strokeBox(x,y,stroke) {
  var ss = ctx.strokeStyle;
  ctx.strokeStyle = stroke;
  ctx.beginPath();
  ctx.moveTo(x-1, y-1);
  ctx.lineTo(x+TILESIZE+1, y-1);
  ctx.lineTo(x+TILESIZE+1, y+TILESIZE+1);
  ctx.lineTo(x-1, y+TILESIZE+1);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = ss;
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

function renderMap() {
  ctx.clearRect(0,0,canvas.width, canvas.height);
  tiles.map(function(row) {
    row.map(function(tile) {
      ctx.putImageData(tile.imgData, tile.x, tile.y);
    });
  });
}
function renderSelectionHighlight(thickness) {
  var s = ctx.fillStyle;
  
  if (thickness === undefined) thickness = 2;
  
  ctx.fillStyle = '#FF0000';
  selectedTilesCoordinates.map(function(c) {
    if (coordinateInArray({x:c.x-1,y:c.y}, selectedTilesCoordinates) == -1) {
      ctx.fillRect(tiles[c.y][c.x].x-thickness,tiles[c.y][c.x].y,thickness,TILESIZE);
    }
    if (coordinateInArray({x:c.x+1,y:c.y}, selectedTilesCoordinates) == -1) {
      ctx.fillRect(tiles[c.y][c.x].x+TILESIZE,tiles[c.y][c.x].y,thickness,TILESIZE);
    }
    if (coordinateInArray({x:c.x,y:c.y-1}, selectedTilesCoordinates) == -1) {
      ctx.fillRect(tiles[c.y][c.x].x,tiles[c.y][c.x].y-thickness,TILESIZE,thickness);
    }
    if (coordinateInArray({x:c.x,y:c.y+1}, selectedTilesCoordinates) == -1) {
      ctx.fillRect(tiles[c.y][c.x].x,tiles[c.y][c.x].y+TILESIZE,TILESIZE,thickness);
    }
    fillBox(tiles[c.y][c.x].x,tiles[c.y][c.x].y,glow);
  });
  
  ctx.fillStyle = s;
}
function renderMostRecentHighlight(thickness) {
  if (thickness === undefined) thickness = 1;
  
  var s = ctx.fillStyle;
  
  ctx.fillStyle = 'rgba(0,0,255,1)';
  var c = mostRecentTileCoordinates;
  ctx.fillRect(tiles[c.y][c.x].x,tiles[c.y][c.x].y,thickness,TILESIZE);
  ctx.fillRect(tiles[c.y][c.x].x+TILESIZE-thickness,tiles[c.y][c.x].y,thickness,TILESIZE);
  ctx.fillRect(tiles[c.y][c.x].x,tiles[c.y][c.x].y,TILESIZE,thickness);
  ctx.fillRect(tiles[c.y][c.x].x,tiles[c.y][c.x].y+TILESIZE-thickness,TILESIZE,thickness);
  
  ctx.fillStyle = s;

}
function renderHighlighter() {
  renderSelectionHighlight();
  renderMostRecentHighlight();
}

function render() {
  renderMap();
  renderHighlighter();
}

function inTileRange(i) {
  return i.x < 16 && i.x >= 0 && i.y < 11 && i.y >= 0;
}
