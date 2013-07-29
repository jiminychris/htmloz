function Parser(fname, tileSize) {
  DEFAULT_COLORS = ["#000000", "#808080", "#C0C0C0", "#FFFFFF"];
  //this._DIRECTIONS = (Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT);
  
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  
  this.colorAllDefinitions = function(defFile, palette, fun) {
    if (!typeof fun === 'function') {
      throw new TypeError();
    }
    var imgDataCache = {};
    var data = {};
    $.getJSON('resources/definitions/'+defFile, function(defData) {
      imgpreload('resources/images/'+defData.file, function(images) {
        var tileSheet = images[0];
        defData.defs.map(function (def) {
          var slice = def.slice;
          if (!Object.keys(imgDataCache).contains(def.name)) {
            ctx.drawImage(tileSheet, slice.x, slice.y, slice.w, slice.h, 0, 0, tileSize, tileSize);
            var pixels = ctx.getImageData(0,0,tileSize,tileSize);
            for (var idx = 0; idx < pixels.data.length; idx+=4) {
              var pixelhex = '#'+[pixels.data[idx], pixels.data[idx+1], pixels.data[idx+2]].map(function (n) {
                return BaseConvert.convert(n.toString(), 10, 16).rjust(2, '0');
              }).join("");
              var rgb = palette[$.inArray(pixelhex, DEFAULT_COLORS)].substring(1,7).match(/.{1,2}/g).map(function (n) {
                return parseInt(BaseConvert.convert(n, 16, 10));
              });
              pixels.data[idx] = rgb[0];
              pixels.data[idx+1] = rgb[1];
              pixels.data[idx+2] = rgb[2];
            }
            imgDataCache[def.name] = pixels;
          }
          def.imgData = pixels;
          data[def.name] = def;
        });
        fun(data);
      });
    });
    
  };
  
  this.parse = function(fun) {
    if (!typeof fun === 'function')
      throw new TypeError();
      
    var parser = {};
    
    $.getJSON(fname, function(mapData) {
      var tilesFile = 'resources/definitions/' + mapData.tiles_file;
      $.getJSON(tilesFile, function(defData) {
        imgpreload('resources/images/'+defData.file, function(images) {
          var imgFile = defData.file;
          var tileDefs = defData.defs;
          var imgDataCache = {};
          var tileSheet = images[0];
          
          parser.defaultColors = DEFAULT_COLORS;
          parser.tilesFile = mapData.tiles_file;
          
          parser.tileSheet = tileSheet;
          parser.palette = mapData.palette;
          parser.tileDefs = tileDefs;
          parser.tiles = mapData.tiles.map(function(row, j) {
            return row.map(function(tile, i) {
              var df = tileDefs.filter(function(def) { return def.name === tile.type; });
              var d = null;
              var slice = null;
              var hitbox = null;
              
              if (df.length !== 1)
                throw new TypeError();
              d = df[0];
              if (!$.inArray('slice', Object.keys(d)))
                throw new TypeError();
              slice = d.slice;
              if ($.inArray('hitbox', Object.keys(d)))
                hitbox = d.hitbox;
                
              var res = {
                'x': i*tileSize,
                'y': j*tileSize,
                'type': tile.type,
                'file': imgFile,
                'slice': slice,
                'hitbox': hitbox
              };
              
              if (!Object.keys(imgDataCache).contains(res.type)) {
                ctx.drawImage(tileSheet, slice.x, slice.y, slice.w, slice.h, 0, 0, tileSize, tileSize);
                var pixels = ctx.getImageData(0,0,tileSize,tileSize);
                for (var idx = 0; idx < pixels.data.length; idx+=4) {
                  var pixelhex = '#'+[pixels.data[idx], pixels.data[idx+1], pixels.data[idx+2]].map(function (n) {
                    return BaseConvert.convert(n.toString(), 10, 16).rjust(2, '0');
                  }).join("");
                  var rgb = mapData.palette[$.inArray(pixelhex, DEFAULT_COLORS)].substring(1,7).match(/.{1,2}/g).map(function (n) {
                    return parseInt(BaseConvert.convert(n, 16, 10));
                  });
                  pixels.data[idx] = rgb[0];
                  pixels.data[idx+1] = rgb[1];
                  pixels.data[idx+2] = rgb[2];
                }
                imgDataCache[res.type] = pixels;
              }
              res.imgData = imgDataCache[res.type];
                
              return res;
            });
          });
          parser.imgDataCache = imgDataCache;
          return fun(parser);
        });
      });
    });
  };
}
