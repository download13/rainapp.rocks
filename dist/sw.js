/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_range_parser__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_range_parser___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_range_parser__);
/* harmony export (immutable) */ __webpack_exports__["a"] = handleAndCacheFile;
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();



var DEFAULT_CHUNK_SIZE = 128 * 1024;

function handleAndCacheFile(request) {
  return ensureFileInfoCached(request.url, DEFAULT_CHUNK_SIZE).then(function (fileInfo) {
    var url = fileInfo.url,
        size = fileInfo.size,
        chunks = fileInfo.chunks;

    var _parseRange = __WEBPACK_IMPORTED_MODULE_0_range_parser___default()(size, request.headers.range || 'bytes=0-'),
        _parseRange2 = _slicedToArray(_parseRange, 1),
        _parseRange2$ = _parseRange2[0],
        start = _parseRange2$.start,
        end = _parseRange2$.end;

    var conversionFactor = chunks.length / size;

    var startChunk = Math.floor(start * conversionFactor);
    var endChunk = Math.ceil(end * conversionFactor);

    var chunksToLoad = chunks.slice(startChunk, endChunk + 1);

    var chunkLoaders = chunksToLoad.map(function (chunkInfo) {
      return function () {
        return ensureChunkCached(url, chunkInfo);
      };
    });

    var bufferOffset = 0;
    var buffer = new Uint8Array(end - start + 1);

    console.log('buffer size', buffer.length);

    return series(chunkLoaders, function (chunk, i) {
      var chunkInfo = chunksToLoad[i];

      if (chunkInfo.start < start) {
        chunk = chunk.slice(start - chunkInfo.start);
      } else if (chunkInfo.end > end) {
        chunk = chunk.slice(0, end - chunkInfo.start + 1);
      }

      buffer.set(chunk, bufferOffset);
      bufferOffset += chunk.byteLength;
    }).then(function () {
      return new Response(buffer.buffer, {
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
          'Content-Length': buffer.buffer.byteLength
        }
      });
    });
  });
}

function ensureFileInfoCached(url, chunkSize) {
  var cacheName = '_bs:' + url;

  return existsInCache(cacheName, '/').then(function (exists) {
    if (!exists) {
      return fetchFileInfo(url, chunkSize).then(function (fileInfo) {
        return storeInCache(cacheName, '/', JSON.stringify(fileInfo));
      });
    } else {
      return fetchFromCache(cacheName, '/', 'json');
    }
  });
}

function ensureChunkCached(url, chunkInfo) {
  var cacheName = '_bs:' + url;
  var cachePath = '/' + chunkInfo.index;

  return existsInCache(cacheName, cachePath).then(function (exists) {
    if (!exists) {
      return fetchChunk(url, chunkInfo).then(function (chunkData) {
        return storeInCache(cacheName, cachePath, chunkData);
      });
    } else {
      return fetchFromCache(cacheName, cachePath);
    }
  });
}

function existsInCache(cacheName, cachePath) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(cachePath);
  }).then(function (res) {
    return !!res;
  });
}

function fetchFromCache(cacheName, cachePath) {
  var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'arrayBuffer';

  return caches.open(cacheName).then(function (cache) {
    return cache.match(cachePath);
  }).then(function (res) {
    return res[type]();
  });
}

function storeInCache(cacheName, cachePath, data) {
  return caches.open(cacheName).then(function (cache) {
    return cache.put(cachePath, new Response(data));
  }).then(function () {
    return data;
  });
}

function fetchChunk(url, chunkInfo) {
  return fetch(url, {
    headers: {
      Range: 'bytes=' + chunkInfo.start + '-' + chunkInfo.end
    }
  }).then(function (res) {
    return res.arrayBuffer();
  });
}

function fetchFileInfo(url, chunkSize) {
  return fetch(url, {
    method: 'HEAD',
    headers: {
      Range: 'bytes=0-0'
    }
  }).then(function (res) {
    var size = parseInt(res.headers.get('content-range').match(/\d+$/)[0]);

    return {
      url: url,
      size: size,
      chunks: getChunkInfos(size, chunkSize)
    };
  });
}

function getChunkInfos(size, chunkSize) {
  var chunkCount = Math.ceil(size / chunkSize);

  var r = [];

  for (var i = 0; i < chunkCount; i++) {
    var start = i * chunkSize;
    var end = Math.min(start + chunkSize - 1, size - 1);

    r.push({ index: i, start: start, end: end });
  }

  return r;
}

function series(actions, onEach) {
  return new Promise(function (resolve, reject) {
    var i = 0;

    next();

    function next() {
      if (actions.length === 0) {
        return resolve();
      }

      var action = actions.shift();
      action().then(function (r) {
        if (onEach) {
          onEach(r, i++);
        }
        next();
      });
    }
  });
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

!function(t,n){ true?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.swkit=n():t.swkit=n()}(this,function(){return function(t){function n(r){if(e[r])return e[r].exports;var i=e[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}var e={};return n.m=t,n.c=e,n.i=function(t){return t},n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:r})},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},n.p="",n(n.s=9)}([function(t,n,e){"use strict";function r(t){return function(n,e){return{displayName:t,props:n,children:e||[]}}}t.exports={Root:r("Root"),Concat:r("Concat"),Literal:r("Literal"),Splat:r("Splat"),Param:r("Param"),Optional:r("Optional")}},function(t,n,e){"use strict";function r(t){return i.forEach(function(n){if("undefined"==typeof t[n])throw new Error("No handler defined for "+n.displayName)}),{visit:function(t,n){return this.handlers[t.displayName].call(this,t,n)},handlers:t}}var i=Object.keys(e(0));t.exports=r},function(t,n,e){"use strict";function r(t,n,e){var r=n.indexOf("=");if(r===-1)return-2;var s=n.slice(r+1).split(","),o=[];o.type=n.slice(0,r);for(var c=0;c<s.length;c++){var a=s[c].split("-"),h=parseInt(a[0],10),u=parseInt(a[1],10);isNaN(h)?(h=t-u,u=t-1):isNaN(u)&&(u=t-1),u>t-1&&(u=t-1),isNaN(h)||isNaN(u)||h>u||h<0||o.push({start:h,end:u})}return o.length<1?-1:e&&e.combine?i(o):o}function i(t){for(var n=t.map(s).sort(a),e=0,r=1;r<n.length;r++){var i=n[r],h=n[e];i.start>h.end+1?n[++e]=i:i.end>h.end&&(h.end=i.end,h.index=Math.min(h.index,i.index))}n.length=e+1;var u=n.sort(c).map(o);return u.type=t.type,u}function s(t,n){return{start:t.start,end:t.end,index:n}}function o(t){return{start:t.start,end:t.end}}function c(t,n){return t.index-n.index}function a(t,n){return t.start-n.start}/*!
 * range-parser
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * Copyright(c) 2015-2016 Douglas Christopher Wilson
 * MIT Licensed
 */
t.exports=r},function(t,n,e){"use strict";var r=e(4);t.exports=r},function(t,n,e){"use strict";function r(t){var n;if(n=this?this:Object.create(r.prototype),"undefined"==typeof t)throw new Error("A route spec is required");return n.spec=t,n.ast=i.parse(t),n}var i=e(6),s=e(7),o=e(8);r.prototype=Object.create(null),r.prototype.match=function(t){var n=s.visit(this.ast),e=n.match(t);return!!e&&e},r.prototype.reverse=function(t){return o.visit(this.ast,t)},t.exports=r},function(t,n,e){var r=function(){function t(){this.yy={}}var n=function(t,n,e,r){for(e=e||{},r=t.length;r--;e[t[r]]=n);return e},e=[1,9],r=[1,10],i=[1,11],s=[1,12],o=[5,11,12,13,14,15],c={trace:function(){},yy:{},symbols_:{error:2,root:3,expressions:4,EOF:5,expression:6,optional:7,literal:8,splat:9,param:10,"(":11,")":12,LITERAL:13,SPLAT:14,PARAM:15,$accept:0,$end:1},terminals_:{2:"error",5:"EOF",11:"(",12:")",13:"LITERAL",14:"SPLAT",15:"PARAM"},productions_:[0,[3,2],[3,1],[4,2],[4,1],[6,1],[6,1],[6,1],[6,1],[7,3],[8,1],[9,1],[10,1]],performAction:function(t,n,e,r,i,s,o){var c=s.length-1;switch(i){case 1:return new r.Root({},[s[c-1]]);case 2:return new r.Root({},[new r.Literal({value:""})]);case 3:this.$=new r.Concat({},[s[c-1],s[c]]);break;case 4:case 5:this.$=s[c];break;case 6:this.$=new r.Literal({value:s[c]});break;case 7:this.$=new r.Splat({name:s[c]});break;case 8:this.$=new r.Param({name:s[c]});break;case 9:this.$=new r.Optional({},[s[c-1]]);break;case 10:this.$=t;break;case 11:case 12:this.$=t.slice(1)}},table:[{3:1,4:2,5:[1,3],6:4,7:5,8:6,9:7,10:8,11:e,13:r,14:i,15:s},{1:[3]},{5:[1,13],6:14,7:5,8:6,9:7,10:8,11:e,13:r,14:i,15:s},{1:[2,2]},n(o,[2,4]),n(o,[2,5]),n(o,[2,6]),n(o,[2,7]),n(o,[2,8]),{4:15,6:4,7:5,8:6,9:7,10:8,11:e,13:r,14:i,15:s},n(o,[2,10]),n(o,[2,11]),n(o,[2,12]),{1:[2,1]},n(o,[2,3]),{6:14,7:5,8:6,9:7,10:8,11:e,12:[1,16],13:r,14:i,15:s},n(o,[2,9])],defaultActions:{3:[2,2],13:[2,1]},parseError:function(t,n){function e(t,n){this.message=t,this.hash=n}if(!n.recoverable)throw e.prototype=Error,new e(t,n);this.trace(t)},parse:function(t){var n=this,e=[0],r=[null],i=[],s=this.table,o="",c=0,a=0,h=0,u=2,l=1,p=i.slice.call(arguments,1),f=Object.create(this.lexer),y={yy:{}};for(var d in this.yy)Object.prototype.hasOwnProperty.call(this.yy,d)&&(y.yy[d]=this.yy[d]);f.setInput(t,y.yy),y.yy.lexer=f,y.yy.parser=this,"undefined"==typeof f.yylloc&&(f.yylloc={});var m=f.yylloc;i.push(m);var g=f.options&&f.options.ranges;"function"==typeof y.yy.parseError?this.parseError=y.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;for(var v,_,x,b,k,w,E,P,A,S=function(){var t;return t=f.lex()||l,"number"!=typeof t&&(t=n.symbols_[t]||t),t},I={};;){if(x=e[e.length-1],this.defaultActions[x]?b=this.defaultActions[x]:(null!==v&&"undefined"!=typeof v||(v=S()),b=s[x]&&s[x][v]),"undefined"==typeof b||!b.length||!b[0]){var L="";A=[];for(w in s[x])this.terminals_[w]&&w>u&&A.push("'"+this.terminals_[w]+"'");L=f.showPosition?"Parse error on line "+(c+1)+":\n"+f.showPosition()+"\nExpecting "+A.join(", ")+", got '"+(this.terminals_[v]||v)+"'":"Parse error on line "+(c+1)+": Unexpected "+(v==l?"end of input":"'"+(this.terminals_[v]||v)+"'"),this.parseError(L,{text:f.match,token:this.terminals_[v]||v,line:f.yylineno,loc:m,expected:A})}if(b[0]instanceof Array&&b.length>1)throw new Error("Parse Error: multiple actions possible at state: "+x+", token: "+v);switch(b[0]){case 1:e.push(v),r.push(f.yytext),i.push(f.yylloc),e.push(b[1]),v=null,_?(v=_,_=null):(a=f.yyleng,o=f.yytext,c=f.yylineno,m=f.yylloc,h>0&&h--);break;case 2:if(E=this.productions_[b[1]][1],I.$=r[r.length-E],I._$={first_line:i[i.length-(E||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(E||1)].first_column,last_column:i[i.length-1].last_column},g&&(I._$.range=[i[i.length-(E||1)].range[0],i[i.length-1].range[1]]),k=this.performAction.apply(I,[o,a,c,y.yy,b[1],r,i].concat(p)),"undefined"!=typeof k)return k;E&&(e=e.slice(0,-1*E*2),r=r.slice(0,-1*E),i=i.slice(0,-1*E)),e.push(this.productions_[b[1]][0]),r.push(I.$),i.push(I._$),P=s[e[e.length-2]][e[e.length-1]],e.push(P);break;case 3:return!0}}return!0}},a=function(){var t={EOF:1,parseError:function(t,n){if(!this.yy.parser)throw new Error(t);this.yy.parser.parseError(t,n)},setInput:function(t,n){return this.yy=n||this.yy||{},this._input=t,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},input:function(){var t=this._input[0];this.yytext+=t,this.yyleng++,this.offset++,this.match+=t,this.matched+=t;var n=t.match(/(?:\r\n?|\n).*/g);return n?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),t},unput:function(t){var n=t.length,e=t.split(/(?:\r\n?|\n)/g);this._input=t+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-n),this.offset-=n;var r=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),e.length-1&&(this.yylineno-=e.length-1);var i=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:e?(e.length===r.length?this.yylloc.first_column:0)+r[r.length-e.length].length-e[0].length:this.yylloc.first_column-n},this.options.ranges&&(this.yylloc.range=[i[0],i[0]+this.yyleng-n]),this.yyleng=this.yytext.length,this},more:function(){return this._more=!0,this},reject:function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},less:function(t){this.unput(this.match.slice(t))},pastInput:function(){var t=this.matched.substr(0,this.matched.length-this.match.length);return(t.length>20?"...":"")+t.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var t=this.match;return t.length<20&&(t+=this._input.substr(0,20-t.length)),(t.substr(0,20)+(t.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var t=this.pastInput(),n=new Array(t.length+1).join("-");return t+this.upcomingInput()+"\n"+n+"^"},test_match:function(t,n){var e,r,i;if(this.options.backtrack_lexer&&(i={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(i.yylloc.range=this.yylloc.range.slice(0))),r=t[0].match(/(?:\r\n?|\n).*/g),r&&(this.yylineno+=r.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:r?r[r.length-1].length-r[r.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+t[0].length},this.yytext+=t[0],this.match+=t[0],this.matches=t,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(t[0].length),this.matched+=t[0],e=this.performAction.call(this,this.yy,this,n,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),e)return e;if(this._backtrack){for(var s in i)this[s]=i[s];return!1}return!1},next:function(){if(this.done)return this.EOF;this._input||(this.done=!0);var t,n,e,r;this._more||(this.yytext="",this.match="");for(var i=this._currentRules(),s=0;s<i.length;s++)if(e=this._input.match(this.rules[i[s]]),e&&(!n||e[0].length>n[0].length)){if(n=e,r=s,this.options.backtrack_lexer){if(t=this.test_match(e,i[s]),t!==!1)return t;if(this._backtrack){n=!1;continue}return!1}if(!this.options.flex)break}return n?(t=this.test_match(n,i[r]),t!==!1&&t):""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){var t=this.next();return t?t:this.lex()},begin:function(t){this.conditionStack.push(t)},popState:function(){var t=this.conditionStack.length-1;return t>0?this.conditionStack.pop():this.conditionStack[0]},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},topState:function(t){return t=this.conditionStack.length-1-Math.abs(t||0),t>=0?this.conditionStack[t]:"INITIAL"},pushState:function(t){this.begin(t)},stateStackSize:function(){return this.conditionStack.length},options:{},performAction:function(t,n,e,r){switch(e){case 0:return"(";case 1:return")";case 2:return"SPLAT";case 3:return"PARAM";case 4:return"LITERAL";case 5:return"LITERAL";case 6:return"EOF"}},rules:[/^(?:\()/,/^(?:\))/,/^(?:\*+\w+)/,/^(?::+\w+)/,/^(?:[\w%\-~\n]+)/,/^(?:.)/,/^(?:$)/],conditions:{INITIAL:{rules:[0,1,2,3,4,5,6],inclusive:!0}}};return t}();return c.lexer=a,t.prototype=c,c.Parser=t,new t}();n.parser=r,n.Parser=r.Parser,n.parse=function(){return r.parse.apply(r,arguments)}},function(t,n,e){"use strict";var r=e(5).parser;r.yy=e(0),t.exports=r},function(t,n,e){"use strict";function r(t){this.captures=t.captures,this.re=t.re}var i=e(1),s=/[\-{}\[\]+?.,\\\^$|#\s]/g;r.prototype.match=function(t){var n=this.re.exec(t),e={};if(n)return this.captures.forEach(function(t,r){"undefined"==typeof n[r+1]?e[t]=void 0:e[t]=decodeURIComponent(n[r+1])}),e};var o=i({Concat:function(t){return t.children.reduce(function(t,n){var e=this.visit(n);return{re:t.re+e.re,captures:t.captures.concat(e.captures)}}.bind(this),{re:"",captures:[]})},Literal:function(t){return{re:t.props.value.replace(s,"\\$&"),captures:[]}},Splat:function(t){return{re:"([^?]*?)",captures:[t.props.name]}},Param:function(t){return{re:"([^\\/\\?]+)",captures:[t.props.name]}},Optional:function(t){var n=this.visit(t.children[0]);return{re:"(?:"+n.re+")?",captures:n.captures}},Root:function(t){var n=this.visit(t.children[0]);return new r({re:new RegExp("^"+n.re+"(?=\\?|$)"),captures:n.captures})}});t.exports=o},function(t,n,e){"use strict";var r=e(1),i=r({Concat:function(t,n){var e=t.children.map(function(t){return this.visit(t,n)}.bind(this));return!e.some(function(t){return t===!1})&&e.join("")},Literal:function(t){return decodeURI(t.props.value)},Splat:function(t,n){return!!n[t.props.name]&&n[t.props.name]},Param:function(t,n){return!!n[t.props.name]&&n[t.props.name]},Optional:function(t,n){var e=this.visit(t.children[0],n);return e?e:""},Root:function(t,n){n=n||{};var e=this.visit(t.children[0],n);return!!e&&encodeURI(e)}});t.exports=i},function(t,n,e){"use strict";function r(t,n){if(!(t instanceof n))throw new TypeError("Cannot call a class as a function")}function i(t,n,e){return addEventListener(t,n,e)}function s(t,n){return caches.open(t).then(function(t){return t.addAll(n)})}function o(t,n,e){return caches.open(t).then(function(t){return t.put(n,e)})}function c(t,n){return caches.open(t).then(function(t){return t.match(n)}).then(function(t){return t?a(n,t):t})}function a(t,n){return n.clone().blob().then(function(e){var r=m()(e.size,t.headers.get("range")||"");if(Array.isArray(r)){var i=r[0],s=i.start,o=i.end,c=e.slice(s,o+1);return new Response(c,{status:206,headers:{"content-type":n.headers.get("content-type"),"content-length":c.size,"content-range":"bytes "+s+"-"+o+"/"+e.size}})}return n})}function h(t,n){var e=function e(r){return c(t[r],n).then(function(n){return n?n:r+1>=t.length?Promise.resolve(null):e(r+1)})};return e(0)}function u(t){return function(n,e){return fetch(n).then(function(e){return o(t,n,e.clone()).then(function(){return e})}).catch(function(){return c(t,n)})}}function l(t){return function(n,e){return c(t,n).then(function(t){return t?t:fetch(n)})}}function p(){return new v}Object.defineProperty(n,"__esModule",{value:!0});var f=e(3),y=e.n(f),d=e(2),m=e.n(d);n.on=i,n.cacheAll=s,n.put=o,n.matchCache=c,n.matchCaches=h,n.networkFirst=u,n.cacheFirst=l,n.createRouter=p;var g=function(){function t(t,n){for(var e=0;e<n.length;e++){var r=n[e];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(n,e,r){return e&&t(n.prototype,e),r&&t(n,r),n}}(),v=function(){function t(){r(this,t),this.routes=[],this.dispatch=this.dispatch.bind(this)}return g(t,[{key:"get",value:function(t,n){var e=new y.a(t);this.routes.push({route:e,handler:n})}},{key:"dispatch",value:function(t){var n=t.request,e=new URL(n.url);if(e.origin===location.origin)for(var r=0;r<this.routes.length;r++){var i=this.routes[r],s=i.route,o=i.handler,c=s.match(e.pathname);if(c){var a=o(n,c);if(a instanceof Response)return void t.respondWith(Promise.resolve(a));if(a instanceof Promise)return void t.respondWith(a);throw console.error("Error handling "+n.url),new Error("Invalid handler response. Must be instance of Response or Promise.")}}}}]),t}()}])});

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * range-parser
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * MIT Licensed
 */



/**
 * Module exports.
 * @public
 */

module.exports = rangeParser;

/**
 * Parse "Range" header `str` relative to the given file `size`.
 *
 * @param {Number} size
 * @param {String} str
 * @return {Array}
 * @public
 */

function rangeParser(size, str) {
  var valid = true;
  var i = str.indexOf('=');

  if (-1 == i) return -2;

  var arr = str.slice(i + 1).split(',').map(function(range){
    var range = range.split('-')
      , start = parseInt(range[0], 10)
      , end = parseInt(range[1], 10);

    // -nnn
    if (isNaN(start)) {
      start = size - end;
      end = size - 1;
    // nnn-
    } else if (isNaN(end)) {
      end = size - 1;
    }

    // limit last-byte-pos to current length
    if (end > size - 1) end = size - 1;

    // invalid
    if (isNaN(start)
      || isNaN(end)
      || start > end
      || start < 0) valid = false;

    return {
      start: start,
      end: end
    };
  });

  arr.type = str.slice(0, i);

  return valid ? arr : -1;
}


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_swkit__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_swkit___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_swkit__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__file_cache__ = __webpack_require__(0);



var router = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["createRouter"])();

var precacheCacheFirst = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["cacheFirst"])('precache_rainapp');

var precachePaths = ['/', '/credits.html', '/js/main.js', '/css/base.css', '/css/checkbox.css', '/css/play-pause.css', '/css/sound.css', '/images/rain_bg.jpg', '/css/comfortaa.woff2', '/icons/weather/campfire.svg', '/icons/weather/crickets.svg', '/icons/weather/drizzle.svg', '/icons/weather/rain.svg', '/icons/weather/wind.svg', '/icons/weather/lightning.svg', '/audio/samples/campfire.ogg', '/audio/samples/crickets.ogg', '/audio/samples/drizzle.ogg', '/audio/samples/rain.ogg', '/audio/samples/wind.ogg', '/audio/samples/lightning.ogg'];

precachePaths.forEach(function (path) {
  router.get(path, precacheCacheFirst);
});

var lazyStaticFiles = ['/audio/full/campfire.ogg', '/audio/full/crickets.ogg', '/audio/full/drizzle.ogg', '/audio/full/rain.ogg', '/audio/full/wind.ogg', '/audio/full/lightning.ogg'];

lazyStaticFiles.forEach(function (path) {
  router.get(path, __WEBPACK_IMPORTED_MODULE_1__file_cache__["a" /* handleAndCacheFile */]);
});

__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["on"])('fetch', router.dispatch);

__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["on"])('install', function (e) {
  e.waitUntil(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["cacheAll"])('precache_rainapp', precachePaths).then(skipWaiting()));
});

__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["on"])('activate', function (e) {
  e.waitUntil(clients.claim());
});

/***/ })
/******/ ]);