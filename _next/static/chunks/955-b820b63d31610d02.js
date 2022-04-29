(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[955],{5553:function(t,e,r){"use strict";r.d(e,{bM:function(){return _},vz:function(){return x}});var n=r(6441),o=r(1581),i=r(8794),a=r(2593);const s=new o.Yd(i.i),u={},f=a.O$.from(0),c=a.O$.from(-1);function l(t,e,r,n){const i={fault:e,operation:r};return void 0!==n&&(i.value=n),s.throwError(t,o.Yd.errors.NUMERIC_FAULT,i)}let d="0";for(;d.length<256;)d+=d;function m(t){if("number"!==typeof t)try{t=a.O$.from(t).toNumber()}catch(e){}return"number"===typeof t&&t>=0&&t<=256&&!(t%1)?"1"+d.substring(0,t):s.throwArgumentError("invalid decimal size","decimals",t)}function h(t,e){null==e&&(e=0);const r=m(e),n=(t=a.O$.from(t)).lt(f);n&&(t=t.mul(c));let o=t.mod(r).toString();for(;o.length<r.length-1;)o="0"+o;o=o.match(/^([0-9]*[1-9]|0)(0*)/)[1];const i=t.div(r).toString();return t=1===r.length?i:i+"."+o,n&&(t="-"+t),t}function p(t,e){null==e&&(e=0);const r=m(e);"string"===typeof t&&t.match(/^-?[0-9.]+$/)||s.throwArgumentError("invalid decimal value","value",t);const n="-"===t.substring(0,1);n&&(t=t.substring(1)),"."===t&&s.throwArgumentError("missing value","value",t);const o=t.split(".");o.length>2&&s.throwArgumentError("too many decimal points","value",t);let i=o[0],u=o[1];for(i||(i="0"),u||(u="0");"0"===u[u.length-1];)u=u.substring(0,u.length-1);for(u.length>r.length-1&&l("fractional component exceeds decimals","underflow","parseFixed"),""===u&&(u="0");u.length<r.length-1;)u+="0";const f=a.O$.from(i),d=a.O$.from(u);let h=f.mul(r).add(d);return n&&(h=h.mul(c)),h}class v{constructor(t,e,r,n){t!==u&&s.throwError("cannot use FixedFormat constructor; use FixedFormat.from",o.Yd.errors.UNSUPPORTED_OPERATION,{operation:"new FixedFormat"}),this.signed=e,this.width=r,this.decimals=n,this.name=(e?"":"u")+"fixed"+String(r)+"x"+String(n),this._multiplier=m(n),Object.freeze(this)}static from(t){if(t instanceof v)return t;"number"===typeof t&&(t=`fixed128x${t}`);let e=!0,r=128,n=18;if("string"===typeof t)if("fixed"===t);else if("ufixed"===t)e=!1;else{const o=t.match(/^(u?)fixed([0-9]+)x([0-9]+)$/);o||s.throwArgumentError("invalid fixed format","format",t),e="u"!==o[1],r=parseInt(o[2]),n=parseInt(o[3])}else if(t){const o=(e,r,n)=>null==t[e]?n:(typeof t[e]!==r&&s.throwArgumentError("invalid fixed format ("+e+" not "+r+")","format."+e,t[e]),t[e]);e=o("signed","boolean",e),r=o("width","number",r),n=o("decimals","number",n)}return r%8&&s.throwArgumentError("invalid fixed format width (not byte aligned)","format.width",r),n>80&&s.throwArgumentError("invalid fixed format (decimals too large)","format.decimals",n),new v(u,e,r,n)}}class g{constructor(t,e,r,n){s.checkNew(new.target,g),t!==u&&s.throwError("cannot use FixedNumber constructor; use FixedNumber.from",o.Yd.errors.UNSUPPORTED_OPERATION,{operation:"new FixedFormat"}),this.format=n,this._hex=e,this._value=r,this._isFixedNumber=!0,Object.freeze(this)}_checkFormat(t){this.format.name!==t.format.name&&s.throwArgumentError("incompatible format; use fixedNumber.toFormat","other",t)}addUnsafe(t){this._checkFormat(t);const e=p(this._value,this.format.decimals),r=p(t._value,t.format.decimals);return g.fromValue(e.add(r),this.format.decimals,this.format)}subUnsafe(t){this._checkFormat(t);const e=p(this._value,this.format.decimals),r=p(t._value,t.format.decimals);return g.fromValue(e.sub(r),this.format.decimals,this.format)}mulUnsafe(t){this._checkFormat(t);const e=p(this._value,this.format.decimals),r=p(t._value,t.format.decimals);return g.fromValue(e.mul(r).div(this.format._multiplier),this.format.decimals,this.format)}divUnsafe(t){this._checkFormat(t);const e=p(this._value,this.format.decimals),r=p(t._value,t.format.decimals);return g.fromValue(e.mul(this.format._multiplier).div(r),this.format.decimals,this.format)}floor(){const t=this.toString().split(".");1===t.length&&t.push("0");let e=g.from(t[0],this.format);const r=!t[1].match(/^(0*)$/);return this.isNegative()&&r&&(e=e.subUnsafe(y.toFormat(e.format))),e}ceiling(){const t=this.toString().split(".");1===t.length&&t.push("0");let e=g.from(t[0],this.format);const r=!t[1].match(/^(0*)$/);return!this.isNegative()&&r&&(e=e.addUnsafe(y.toFormat(e.format))),e}round(t){null==t&&(t=0);const e=this.toString().split(".");if(1===e.length&&e.push("0"),(t<0||t>80||t%1)&&s.throwArgumentError("invalid decimal count","decimals",t),e[1].length<=t)return this;const r=g.from("1"+d.substring(0,t),this.format),n=w.toFormat(this.format);return this.mulUnsafe(r).addUnsafe(n).floor().divUnsafe(r)}isZero(){return"0.0"===this._value||"0"===this._value}isNegative(){return"-"===this._value[0]}toString(){return this._value}toHexString(t){if(null==t)return this._hex;t%8&&s.throwArgumentError("invalid byte width","width",t);const e=a.O$.from(this._hex).fromTwos(this.format.width).toTwos(t).toHexString();return(0,n.$m)(e,t/8)}toUnsafeFloat(){return parseFloat(this.toString())}toFormat(t){return g.fromString(this._value,t)}static fromValue(t,e,r){return null!=r||null==e||(0,a.Zm)(e)||(r=e,e=null),null==e&&(e=0),null==r&&(r="fixed"),g.fromString(h(t,e),v.from(r))}static fromString(t,e){null==e&&(e="fixed");const r=v.from(e),o=p(t,r.decimals);!r.signed&&o.lt(f)&&l("unsigned value cannot be negative","overflow","value",t);let i=null;r.signed?i=o.toTwos(r.width).toHexString():(i=o.toHexString(),i=(0,n.$m)(i,r.width/8));const a=h(o,r.decimals);return new g(u,i,a,r)}static fromBytes(t,e){null==e&&(e="fixed");const r=v.from(e);if((0,n.lE)(t).length>r.width/8)throw new Error("overflow");let o=a.O$.from(t);r.signed&&(o=o.fromTwos(r.width));const i=o.toTwos((r.signed?0:1)+r.width).toHexString(),s=h(o,r.decimals);return new g(u,i,s,r)}static from(t,e){if("string"===typeof t)return g.fromString(t,e);if((0,n._t)(t))return g.fromBytes(t,e);try{return g.fromValue(t,0,e)}catch(r){if(r.code!==o.Yd.errors.INVALID_ARGUMENT)throw r}return s.throwArgumentError("invalid FixedNumber value","value",t)}static isFixedNumber(t){return!(!t||!t._isFixedNumber)}}const y=g.from(1),w=g.from("0.5"),b=new o.Yd("units/5.6.0"),O=["wei","kwei","mwei","gwei","szabo","finney","ether"];function _(t,e){if("string"===typeof e){const t=O.indexOf(e);-1!==t&&(e=3*t)}return h(t,null!=e?e:18)}function x(t,e){if("string"!==typeof t&&b.throwArgumentError("value must be a string","value",t),"string"===typeof e){const t=O.indexOf(e);-1!==t&&(e=3*t)}return p(t,null!=e?e:18)}},7285:function(t,e,r){"use strict";var n;Object.defineProperty(e,"__esModule",{value:!0}),e.AmpStateContext=void 0;var o=((n=r(7294))&&n.__esModule?n:{default:n}).default.createContext({});e.AmpStateContext=o},9546:function(t,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.isInAmpMode=a,e.useAmp=function(){return a(o.default.useContext(i.AmpStateContext))};var n,o=(n=r(7294))&&n.__esModule?n:{default:n},i=r(7285);function a(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=t.ampFirst,r=void 0!==e&&e,n=t.hybrid,o=void 0!==n&&n,i=t.hasQuery,a=void 0!==i&&i;return r||o&&a}},6505:function(t,e,r){"use strict";var n=r(930);function o(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}Object.defineProperty(e,"__esModule",{value:!0}),e.defaultHead=l,e.default=void 0;var i,a=function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var r in t)if(Object.prototype.hasOwnProperty.call(t,r)){var n=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(t,r):{};n.get||n.set?Object.defineProperty(e,r,n):e[r]=t[r]}return e.default=t,e}(r(7294)),s=(i=r(148))&&i.__esModule?i:{default:i},u=r(7285),f=r(523),c=r(9546);r(7206);function l(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0],e=[a.default.createElement("meta",{charSet:"utf-8"})];return t||e.push(a.default.createElement("meta",{name:"viewport",content:"width=device-width"})),e}function d(t,e){return"string"===typeof e||"number"===typeof e?t:e.type===a.default.Fragment?t.concat(a.default.Children.toArray(e.props.children).reduce((function(t,e){return"string"===typeof e||"number"===typeof e?t:t.concat(e)}),[])):t.concat(e)}var m=["name","httpEquiv","charSet","itemProp"];function h(t,e){return t.reduce((function(t,e){var r=a.default.Children.toArray(e.props.children);return t.concat(r)}),[]).reduce(d,[]).reverse().concat(l(e.inAmpMode)).filter(function(){var t=new Set,e=new Set,r=new Set,n={};return function(o){var i=!0,a=!1;if(o.key&&"number"!==typeof o.key&&o.key.indexOf("$")>0){a=!0;var s=o.key.slice(o.key.indexOf("$")+1);t.has(s)?i=!1:t.add(s)}switch(o.type){case"title":case"base":e.has(o.type)?i=!1:e.add(o.type);break;case"meta":for(var u=0,f=m.length;u<f;u++){var c=m[u];if(o.props.hasOwnProperty(c))if("charSet"===c)r.has(c)?i=!1:r.add(c);else{var l=o.props[c],d=n[c]||new Set;"name"===c&&a||!d.has(l)?(d.add(l),n[c]=d):i=!1}}}return i}}()).reverse().map((function(t,r){var i=t.key||r;if(!e.inAmpMode&&"link"===t.type&&t.props.href&&["https://fonts.googleapis.com/css","https://use.typekit.net/"].some((function(e){return t.props.href.startsWith(e)}))){var s=function(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?o(Object(r),!0).forEach((function(e){n(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}({},t.props||{});return s["data-href"]=s.href,s.href=void 0,s["data-optimized-fonts"]=!0,a.default.cloneElement(t,s)}return a.default.cloneElement(t,{key:i})}))}var p=function(t){var e=t.children,r=a.useContext(u.AmpStateContext),n=a.useContext(f.HeadManagerContext);return a.default.createElement(s.default,{reduceComponentsToState:h,headManager:n,inAmpMode:c.isInAmpMode(r)},e)};e.default=p},148:function(t,e,r){"use strict";var n=r(7980),o=r(3227),i=r(8361),a=(r(2191),r(5971)),s=r(2715),u=r(1193);function f(t){var e=function(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var r,n=u(t);if(e){var o=u(this).constructor;r=Reflect.construct(n,arguments,o)}else r=n.apply(this,arguments);return s(this,r)}}Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var c=function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var r in t)if(Object.prototype.hasOwnProperty.call(t,r)){var n=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(t,r):{};n.get||n.set?Object.defineProperty(e,r,n):e[r]=t[r]}return e.default=t,e}(r(7294));var l=function(t){a(r,t);var e=f(r);function r(t){var i;return o(this,r),(i=e.call(this,t)).emitChange=function(){i._hasHeadManager&&i.props.headManager.updateHead(i.props.reduceComponentsToState(n(i.props.headManager.mountedInstances),i.props))},i._hasHeadManager=i.props.headManager&&i.props.headManager.mountedInstances,i}return i(r,[{key:"componentDidMount",value:function(){this._hasHeadManager&&this.props.headManager.mountedInstances.add(this),this.emitChange()}},{key:"componentDidUpdate",value:function(){this.emitChange()}},{key:"componentWillUnmount",value:function(){this._hasHeadManager&&this.props.headManager.mountedInstances.delete(this),this.emitChange()}},{key:"render",value:function(){return null}}]),r}(c.Component);e.default=l},9008:function(t,e,r){t.exports=r(6505)},29:function(t,e,r){"use strict";function n(t,e,r,n,o,i,a){try{var s=t[i](a),u=s.value}catch(f){return void r(f)}s.done?e(u):Promise.resolve(u).then(n,o)}function o(t){return function(){var e=this,r=arguments;return new Promise((function(o,i){var a=t.apply(e,r);function s(t){n(a,o,i,s,u,"next",t)}function u(t){n(a,o,i,s,u,"throw",t)}s(void 0)}))}}r.d(e,{Z:function(){return o}})}}]);