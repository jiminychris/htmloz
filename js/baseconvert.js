var BaseConvert = (function() {
  var oldLog = Math.log;
  Math.log = function(x, y) {
    return oldLog(x) / oldLog(y);
  };
  Array.prototype.contains = function(obj) {
    for (var i=0;i<this.length;i++) {
      if (this[i] === obj) {
        return true;
      }
    }
    return false;
  };
  Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
  }
  String.prototype.zfill = function(n) {
    var diff = n - this.length;
    if (diff > 0) {
      return '0'.repeat(diff) + this;
    } else {
      return this;
    }
  };
  String.prototype.ljust = function(n, s) {
    var diff = n - this.length;
    if (diff > 0) {
      return this + (s.repeat(diff).substring(0, diff));
    } else {
      return this;
    }
  };
  String.prototype.rjust = function(n, s) {
    var diff = n - this.length;
    if (diff > 0) {
      return (s.repeat(diff).substring(0, diff)) + this;
    } else {
      return this;
    }
  };
  String.prototype.repeat = function(n) {
   return new Array(n+1).join(this);
  };
  function range(n) {
    var a = new Array(n);
    for(var i=0;i<n;i++) {
      a[i] = i;
    }
    return a;
  };

  var alphabets = {
    2 :'01',
    8 :'01234567',
    10:'0123456789',
    16:'0123456789ABCDEF',
    32:'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
    64:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  };

  var pad = '=';

  function Exception(n) {
    return function(msg) {
      return {
        name: n,
        message: msg
      };
    };
  };

  var ParseError = Exception('ParseError');
  var BaseUnsupported = Exception('BaseUnsupported');

  function _value(ch, base) {
    /**<sum>Gets the value of a character in the specified base.</sum>
    
    <arg id="ch" type="str">
      The character whose value to determine.
    </arg>
    <arg id="base" type="int">
      The alleged base of the given character.
    </arg>
    
    <return>int</return>
    
    <except>Raises 'BaseUnsupported' if the base is unsupported.</except>
    <except>
      Raises 'ParseError' if the character does not exist in the base.
    </except>
    **/
    
    if (!Object.keys(alphabets).contains(base.toString())) {
      throw BaseUnsupported(base);
    }
    if (base < 36) {
      ch = ch.toUpperCase();
    }
    var val = alphabets[base].indexOf(ch);
    if (val < 0) {
      throw ParseError('Character \''+ch+'\' does not exist in base '+s)
    }
    return val;
  };
    

  function _char(val, base) {
    /**<sum>Gets the representation of a value in the specified base.</sum>
    
    <return>str</return>
    
    <except>Raises 'BaseUnsupported' if the base is unsupported.</except>
    <except>Raises 'ValueError' if the value is out of range.</except>
    **/
    
    if (!Object.keys(alphabets).contains(base.toString())) {
      throw BaseUnsupported(base);
    }
    if (val < 0 || val >= base) {
      throw ValueError('Value \''+val+'\' is out of range for base '+base);
    }
    return alphabets[base][val]
  }
    
  function _to_base_10(s, base) {
    /**<sum>Converts a string of a given base to a base 10 integer.</sum>
    
    <return>int</return>
    **/
    
    var l = s.length;
    return range(l).map(function(i) {
      return _value(s[i], base)*Math.pow(base, ((l-1)-i));
    }).reduce(function(p, c, i, a) {
      return p+c;
    });
  }
 
  function _to_base_x(n, base) {
    /**<sum>Converts an integer to a string in a given base.</sum>
    
    <return>str</return>
    **/
    
    if (n < base) {
      return _char(n, base);
    }
    else {
      var q = Math.floor(n / base)
      var r = n % base
      return _to_base_x(q, base) + _char(r, base);
    }
  }
    

  function convert(value, bfrom, bto) {
    /**<sum>Attempt to parse and convert a value from one base to another.</sum>
     
    <arg id="value" type="str">
      The value to be converted.
    </arg>
    <kwarg id="bfrom" type="int">
      The alleged base of the given value.
    </kwarg>   
    <kwarg id="bto" type="int">
      The base of the return value.
    </kwarg>
    
    <return>str</return>
    
    <except>Raises 'ParseError' if value contains invalid characters.</except>
    <except>Raises 'BaseUnsupported' if a base is unsupported.</except>
    **/
    
    return _to_base_x(_to_base_10(value.replace(/\s/g, ''), bfrom), bto).toString();
  }
    
  /*** Stolen from https://gist.github.com/endolith/114336 ***/
  // Greatest common divisor of more than 2 numbers.  Am I terrible for doing it this way?
   
  function gcd(a, b) {
    /**Return the greatest common divisor of the given integers**/
    if (b == 0) {
      return a;
    } else {
      return gcd(b, a % b);
    }
  };
   
  // Least common multiple is not in standard libraries? It's in gmpy, but this is simple enough:
   
  function lcm(a, b) {
    /**Return lowest common multiple.**/
    return Math.floor((a * b) / gcd(a, b));
  };
  // Assuming numbers are positive integers...
  /***/

  function encode(buffer, base) {
    /**<sum>Attempt to encode a byte buffer in a given base.</sum>
     
    <arg id="text" type="str">
      The string to be converted.
    </arg>
    <kwarg id="base" type="int">
      The base of the return value.
    </kwarg>
    
    <return>str</return>
    
    <except>Raises 'BaseUnsupported' if the base is unsupported.</except>
    **/
    
    var buf = buffer.map(function(byte) {
      return _to_base_x(byte, 2).zfill(8);
    }).join('');
    if (base == 32 || base == 64) {
      var n = Math.floor(Math.log(base, 2))
      var l = Math.floor(lcm(8, n) / n)
      
      buf = buf.match(new RegExp('.{1,'+n+'}', 'g'));
      buf[buf.length-1] = buf[buf.length-1].ljust(n,'0')
      buf = buf.map(function(chnk) {
        return convert(chnk, 2, base);
      }).join('');
      buf = buf.ljust(buf.length + ((-buf.length).mod(l)), '=');
    } else {
      buf = buffer.map(function(byte) {
        return _to_base_x(byte, base).zfill(Math.ceil(Math.log(256,base)));
      }).join('');
    }
    
    return buf.toString();
  };
  
  return {
    'alphabets': alphabets,
    'pad': pad,
    'ParseError': ParseError,
    'BaseUnsupported': BaseUnsupported,
    'convert': convert,
    'encode': encode
  };
})();
