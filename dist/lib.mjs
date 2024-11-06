function H(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var N = {};
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
N.read = function(t, e, i, n, r) {
  var s, o, f = r * 8 - n - 1, u = (1 << f) - 1, x = u >> 1, a = -7, c = i ? r - 1 : 0, F = i ? -1 : 1, d = t[e + c];
  for (c += F, s = d & (1 << -a) - 1, d >>= -a, a += f; a > 0; s = s * 256 + t[e + c], c += F, a -= 8)
    ;
  for (o = s & (1 << -a) - 1, s >>= -a, a += n; a > 0; o = o * 256 + t[e + c], c += F, a -= 8)
    ;
  if (s === 0)
    s = 1 - x;
  else {
    if (s === u)
      return o ? NaN : (d ? -1 : 1) * (1 / 0);
    o = o + Math.pow(2, n), s = s - x;
  }
  return (d ? -1 : 1) * o * Math.pow(2, s - n);
};
N.write = function(t, e, i, n, r, s) {
  var o, f, u, x = s * 8 - r - 1, a = (1 << x) - 1, c = a >> 1, F = r === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, d = n ? 0 : s - 1, w = n ? 1 : -1, g = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
  for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (f = isNaN(e) ? 1 : 0, o = a) : (o = Math.floor(Math.log(e) / Math.LN2), e * (u = Math.pow(2, -o)) < 1 && (o--, u *= 2), o + c >= 1 ? e += F / u : e += F * Math.pow(2, 1 - c), e * u >= 2 && (o++, u /= 2), o + c >= a ? (f = 0, o = a) : o + c >= 1 ? (f = (e * u - 1) * Math.pow(2, r), o = o + c) : (f = e * Math.pow(2, c - 1) * Math.pow(2, r), o = 0)); r >= 8; t[i + d] = f & 255, d += w, f /= 256, r -= 8)
    ;
  for (o = o << r | f, x += r; x > 0; t[i + d] = o & 255, d += w, o /= 256, x -= 8)
    ;
  t[i + d - w] |= g * 128;
};
var U = h, M = N;
function h(t) {
  this.buf = ArrayBuffer.isView && ArrayBuffer.isView(t) ? t : new Uint8Array(t || 0), this.pos = 0, this.type = 0, this.length = this.buf.length;
}
h.Varint = 0;
h.Fixed64 = 1;
h.Bytes = 2;
h.Fixed32 = 5;
var E = 65536 * 65536, A = 1 / E, K = 12, I = typeof TextDecoder > "u" ? null : new TextDecoder("utf8");
h.prototype = {
  destroy: function() {
    this.buf = null;
  },
  // === READING =================================================================
  readFields: function(t, e, i) {
    for (i = i || this.length; this.pos < i; ) {
      var n = this.readVarint(), r = n >> 3, s = this.pos;
      this.type = n & 7, t(r, e, this), this.pos === s && this.skip(n);
    }
    return e;
  },
  readMessage: function(t, e) {
    return this.readFields(t, e, this.readVarint() + this.pos);
  },
  readFixed32: function() {
    var t = D(this.buf, this.pos);
    return this.pos += 4, t;
  },
  readSFixed32: function() {
    var t = _(this.buf, this.pos);
    return this.pos += 4, t;
  },
  // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)
  readFixed64: function() {
    var t = D(this.buf, this.pos) + D(this.buf, this.pos + 4) * E;
    return this.pos += 8, t;
  },
  readSFixed64: function() {
    var t = D(this.buf, this.pos) + _(this.buf, this.pos + 4) * E;
    return this.pos += 8, t;
  },
  readFloat: function() {
    var t = M.read(this.buf, this.pos, !0, 23, 4);
    return this.pos += 4, t;
  },
  readDouble: function() {
    var t = M.read(this.buf, this.pos, !0, 52, 8);
    return this.pos += 8, t;
  },
  readVarint: function(t) {
    var e = this.buf, i, n;
    return n = e[this.pos++], i = n & 127, n < 128 || (n = e[this.pos++], i |= (n & 127) << 7, n < 128) || (n = e[this.pos++], i |= (n & 127) << 14, n < 128) || (n = e[this.pos++], i |= (n & 127) << 21, n < 128) ? i : (n = e[this.pos], i |= (n & 15) << 28, X(i, t, this));
  },
  readVarint64: function() {
    return this.readVarint(!0);
  },
  readSVarint: function() {
    var t = this.readVarint();
    return t % 2 === 1 ? (t + 1) / -2 : t / 2;
  },
  readBoolean: function() {
    return !!this.readVarint();
  },
  readString: function() {
    var t = this.readVarint() + this.pos, e = this.pos;
    return this.pos = t, t - e >= K && I ? st(this.buf, e, t) : nt(this.buf, e, t);
  },
  readBytes: function() {
    var t = this.readVarint() + this.pos, e = this.buf.subarray(this.pos, t);
    return this.pos = t, e;
  },
  // verbose for performance reasons; doesn't affect gzipped size
  readPackedVarint: function(t, e) {
    if (this.type !== h.Bytes) return t.push(this.readVarint(e));
    var i = y(this);
    for (t = t || []; this.pos < i; ) t.push(this.readVarint(e));
    return t;
  },
  readPackedSVarint: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readSVarint());
    var e = y(this);
    for (t = t || []; this.pos < e; ) t.push(this.readSVarint());
    return t;
  },
  readPackedBoolean: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readBoolean());
    var e = y(this);
    for (t = t || []; this.pos < e; ) t.push(this.readBoolean());
    return t;
  },
  readPackedFloat: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readFloat());
    var e = y(this);
    for (t = t || []; this.pos < e; ) t.push(this.readFloat());
    return t;
  },
  readPackedDouble: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readDouble());
    var e = y(this);
    for (t = t || []; this.pos < e; ) t.push(this.readDouble());
    return t;
  },
  readPackedFixed32: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readFixed32());
    var e = y(this);
    for (t = t || []; this.pos < e; ) t.push(this.readFixed32());
    return t;
  },
  readPackedSFixed32: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readSFixed32());
    var e = y(this);
    for (t = t || []; this.pos < e; ) t.push(this.readSFixed32());
    return t;
  },
  readPackedFixed64: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readFixed64());
    var e = y(this);
    for (t = t || []; this.pos < e; ) t.push(this.readFixed64());
    return t;
  },
  readPackedSFixed64: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readSFixed64());
    var e = y(this);
    for (t = t || []; this.pos < e; ) t.push(this.readSFixed64());
    return t;
  },
  skip: function(t) {
    var e = t & 7;
    if (e === h.Varint) for (; this.buf[this.pos++] > 127; )
      ;
    else if (e === h.Bytes) this.pos = this.readVarint() + this.pos;
    else if (e === h.Fixed32) this.pos += 4;
    else if (e === h.Fixed64) this.pos += 8;
    else throw new Error("Unimplemented type: " + e);
  },
  // === WRITING =================================================================
  writeTag: function(t, e) {
    this.writeVarint(t << 3 | e);
  },
  realloc: function(t) {
    for (var e = this.length || 16; e < this.pos + t; ) e *= 2;
    if (e !== this.length) {
      var i = new Uint8Array(e);
      i.set(this.buf), this.buf = i, this.length = e;
    }
  },
  finish: function() {
    return this.length = this.pos, this.pos = 0, this.buf.subarray(0, this.length);
  },
  writeFixed32: function(t) {
    this.realloc(4), k(this.buf, t, this.pos), this.pos += 4;
  },
  writeSFixed32: function(t) {
    this.realloc(4), k(this.buf, t, this.pos), this.pos += 4;
  },
  writeFixed64: function(t) {
    this.realloc(8), k(this.buf, t & -1, this.pos), k(this.buf, Math.floor(t * A), this.pos + 4), this.pos += 8;
  },
  writeSFixed64: function(t) {
    this.realloc(8), k(this.buf, t & -1, this.pos), k(this.buf, Math.floor(t * A), this.pos + 4), this.pos += 8;
  },
  writeVarint: function(t) {
    if (t = +t || 0, t > 268435455 || t < 0) {
      z(t, this);
      return;
    }
    this.realloc(4), this.buf[this.pos++] = t & 127 | (t > 127 ? 128 : 0), !(t <= 127) && (this.buf[this.pos++] = (t >>>= 7) & 127 | (t > 127 ? 128 : 0), !(t <= 127) && (this.buf[this.pos++] = (t >>>= 7) & 127 | (t > 127 ? 128 : 0), !(t <= 127) && (this.buf[this.pos++] = t >>> 7 & 127)));
  },
  writeSVarint: function(t) {
    this.writeVarint(t < 0 ? -t * 2 - 1 : t * 2);
  },
  writeBoolean: function(t) {
    this.writeVarint(!!t);
  },
  writeString: function(t) {
    t = String(t), this.realloc(t.length * 4), this.pos++;
    var e = this.pos;
    this.pos = ot(this.buf, t, this.pos);
    var i = this.pos - e;
    i >= 128 && O(e, i, this), this.pos = e - 1, this.writeVarint(i), this.pos += i;
  },
  writeFloat: function(t) {
    this.realloc(4), M.write(this.buf, t, this.pos, !0, 23, 4), this.pos += 4;
  },
  writeDouble: function(t) {
    this.realloc(8), M.write(this.buf, t, this.pos, !0, 52, 8), this.pos += 8;
  },
  writeBytes: function(t) {
    var e = t.length;
    this.writeVarint(e), this.realloc(e);
    for (var i = 0; i < e; i++) this.buf[this.pos++] = t[i];
  },
  writeRawMessage: function(t, e) {
    this.pos++;
    var i = this.pos;
    t(e, this);
    var n = this.pos - i;
    n >= 128 && O(i, n, this), this.pos = i - 1, this.writeVarint(n), this.pos += n;
  },
  writeMessage: function(t, e, i) {
    this.writeTag(t, h.Bytes), this.writeRawMessage(e, i);
  },
  writePackedVarint: function(t, e) {
    e.length && this.writeMessage(t, W, e);
  },
  writePackedSVarint: function(t, e) {
    e.length && this.writeMessage(t, Y, e);
  },
  writePackedBoolean: function(t, e) {
    e.length && this.writeMessage(t, J, e);
  },
  writePackedFloat: function(t, e) {
    e.length && this.writeMessage(t, Z, e);
  },
  writePackedDouble: function(t, e) {
    e.length && this.writeMessage(t, q, e);
  },
  writePackedFixed32: function(t, e) {
    e.length && this.writeMessage(t, tt, e);
  },
  writePackedSFixed32: function(t, e) {
    e.length && this.writeMessage(t, et, e);
  },
  writePackedFixed64: function(t, e) {
    e.length && this.writeMessage(t, it, e);
  },
  writePackedSFixed64: function(t, e) {
    e.length && this.writeMessage(t, rt, e);
  },
  writeBytesField: function(t, e) {
    this.writeTag(t, h.Bytes), this.writeBytes(e);
  },
  writeFixed32Field: function(t, e) {
    this.writeTag(t, h.Fixed32), this.writeFixed32(e);
  },
  writeSFixed32Field: function(t, e) {
    this.writeTag(t, h.Fixed32), this.writeSFixed32(e);
  },
  writeFixed64Field: function(t, e) {
    this.writeTag(t, h.Fixed64), this.writeFixed64(e);
  },
  writeSFixed64Field: function(t, e) {
    this.writeTag(t, h.Fixed64), this.writeSFixed64(e);
  },
  writeVarintField: function(t, e) {
    this.writeTag(t, h.Varint), this.writeVarint(e);
  },
  writeSVarintField: function(t, e) {
    this.writeTag(t, h.Varint), this.writeSVarint(e);
  },
  writeStringField: function(t, e) {
    this.writeTag(t, h.Bytes), this.writeString(e);
  },
  writeFloatField: function(t, e) {
    this.writeTag(t, h.Fixed32), this.writeFloat(e);
  },
  writeDoubleField: function(t, e) {
    this.writeTag(t, h.Fixed64), this.writeDouble(e);
  },
  writeBooleanField: function(t, e) {
    this.writeVarintField(t, !!e);
  }
};
function X(t, e, i) {
  var n = i.buf, r, s;
  if (s = n[i.pos++], r = (s & 112) >> 4, s < 128 || (s = n[i.pos++], r |= (s & 127) << 3, s < 128) || (s = n[i.pos++], r |= (s & 127) << 10, s < 128) || (s = n[i.pos++], r |= (s & 127) << 17, s < 128) || (s = n[i.pos++], r |= (s & 127) << 24, s < 128) || (s = n[i.pos++], r |= (s & 1) << 31, s < 128)) return B(t, r, e);
  throw new Error("Expected varint not more than 10 bytes");
}
function y(t) {
  return t.type === h.Bytes ? t.readVarint() + t.pos : t.pos + 1;
}
function B(t, e, i) {
  return i ? e * 4294967296 + (t >>> 0) : (e >>> 0) * 4294967296 + (t >>> 0);
}
function z(t, e) {
  var i, n;
  if (t >= 0 ? (i = t % 4294967296 | 0, n = t / 4294967296 | 0) : (i = ~(-t % 4294967296), n = ~(-t / 4294967296), i ^ 4294967295 ? i = i + 1 | 0 : (i = 0, n = n + 1 | 0)), t >= 18446744073709552e3 || t < -18446744073709552e3)
    throw new Error("Given varint doesn't fit into 10 bytes");
  e.realloc(10), L(i, n, e), Q(n, e);
}
function L(t, e, i) {
  i.buf[i.pos++] = t & 127 | 128, t >>>= 7, i.buf[i.pos++] = t & 127 | 128, t >>>= 7, i.buf[i.pos++] = t & 127 | 128, t >>>= 7, i.buf[i.pos++] = t & 127 | 128, t >>>= 7, i.buf[i.pos] = t & 127;
}
function Q(t, e) {
  var i = (t & 7) << 4;
  e.buf[e.pos++] |= i | ((t >>>= 3) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127)))));
}
function O(t, e, i) {
  var n = e <= 16383 ? 1 : e <= 2097151 ? 2 : e <= 268435455 ? 3 : Math.floor(Math.log(e) / (Math.LN2 * 7));
  i.realloc(n);
  for (var r = i.pos - 1; r >= t; r--) i.buf[r + n] = i.buf[r];
}
function W(t, e) {
  for (var i = 0; i < t.length; i++) e.writeVarint(t[i]);
}
function Y(t, e) {
  for (var i = 0; i < t.length; i++) e.writeSVarint(t[i]);
}
function Z(t, e) {
  for (var i = 0; i < t.length; i++) e.writeFloat(t[i]);
}
function q(t, e) {
  for (var i = 0; i < t.length; i++) e.writeDouble(t[i]);
}
function J(t, e) {
  for (var i = 0; i < t.length; i++) e.writeBoolean(t[i]);
}
function tt(t, e) {
  for (var i = 0; i < t.length; i++) e.writeFixed32(t[i]);
}
function et(t, e) {
  for (var i = 0; i < t.length; i++) e.writeSFixed32(t[i]);
}
function it(t, e) {
  for (var i = 0; i < t.length; i++) e.writeFixed64(t[i]);
}
function rt(t, e) {
  for (var i = 0; i < t.length; i++) e.writeSFixed64(t[i]);
}
function D(t, e) {
  return (t[e] | t[e + 1] << 8 | t[e + 2] << 16) + t[e + 3] * 16777216;
}
function k(t, e, i) {
  t[i] = e, t[i + 1] = e >>> 8, t[i + 2] = e >>> 16, t[i + 3] = e >>> 24;
}
function _(t, e) {
  return (t[e] | t[e + 1] << 8 | t[e + 2] << 16) + (t[e + 3] << 24);
}
function nt(t, e, i) {
  for (var n = "", r = e; r < i; ) {
    var s = t[r], o = null, f = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
    if (r + f > i) break;
    var u, x, a;
    f === 1 ? s < 128 && (o = s) : f === 2 ? (u = t[r + 1], (u & 192) === 128 && (o = (s & 31) << 6 | u & 63, o <= 127 && (o = null))) : f === 3 ? (u = t[r + 1], x = t[r + 2], (u & 192) === 128 && (x & 192) === 128 && (o = (s & 15) << 12 | (u & 63) << 6 | x & 63, (o <= 2047 || o >= 55296 && o <= 57343) && (o = null))) : f === 4 && (u = t[r + 1], x = t[r + 2], a = t[r + 3], (u & 192) === 128 && (x & 192) === 128 && (a & 192) === 128 && (o = (s & 15) << 18 | (u & 63) << 12 | (x & 63) << 6 | a & 63, (o <= 65535 || o >= 1114112) && (o = null))), o === null ? (o = 65533, f = 1) : o > 65535 && (o -= 65536, n += String.fromCharCode(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), n += String.fromCharCode(o), r += f;
  }
  return n;
}
function st(t, e, i) {
  return I.decode(t.subarray(e, i));
}
function ot(t, e, i) {
  for (var n = 0, r, s; n < e.length; n++) {
    if (r = e.charCodeAt(n), r > 55295 && r < 57344)
      if (s)
        if (r < 56320) {
          t[i++] = 239, t[i++] = 191, t[i++] = 189, s = r;
          continue;
        } else
          r = s - 55296 << 10 | r - 56320 | 65536, s = null;
      else {
        r > 56319 || n + 1 === e.length ? (t[i++] = 239, t[i++] = 191, t[i++] = 189) : s = r;
        continue;
      }
    else s && (t[i++] = 239, t[i++] = 191, t[i++] = 189, s = null);
    r < 128 ? t[i++] = r : (r < 2048 ? t[i++] = r >> 6 | 192 : (r < 65536 ? t[i++] = r >> 12 | 224 : (t[i++] = r >> 18 | 240, t[i++] = r >> 12 & 63 | 128), t[i++] = r >> 6 & 63 | 128), t[i++] = r & 63 | 128);
  }
  return i;
}
const G = /* @__PURE__ */ H(U), $ = 1;
var ht = /* @__PURE__ */ ((t) => (t[t.Boolean = 1] = "Boolean", t[t.Number = 2] = "Number", t[t.String = 3] = "String", t[t.Object = 4] = "Object", t[t.Array = 5] = "Array", t[t.Null = 6] = "Null", t))(ht || {}), ft = /* @__PURE__ */ ((t) => (t[t.Generic = 1] = "Generic", t[t.Columnar = 2] = "Columnar", t[t.Row = 3] = "Row", t))(ft || {}), at = /* @__PURE__ */ ((t) => (t[t.Generic = 1] = "Generic", t[t.Columnar = 2] = "Columnar", t[t.Row = 3] = "Row", t))(at || {});
function ut(t, e) {
  let i = t.stringMap[e];
  return i === void 0 && (i = t.strings.length, t.strings.push(e), t.stringMap[e] = i), i;
}
function dt(t, e, i) {
  t.writeVarint(e << 3 | i);
}
const P = {
  1: ({ pbf: t }, e) => {
    t.writeBoolean(e);
  },
  2: ({ pbf: t }, e) => {
    t.writeDouble(e);
  },
  3: ({ pbf: t }, e) => {
    t.writeString(e);
  },
  4: (t, e) => {
    if (e === null)
      return;
    const { pbf: i } = t, n = Object.keys(e);
    i.writeVarint(n.length), n.forEach((r) => {
      v(e[r], t, ut(t, r));
    });
  },
  5: (t, e) => {
    const { pbf: i } = t, n = e.length;
    i.writeVarint(n);
    for (let r = 0; r < n; r++)
      v(e[r], t);
  },
  6: (t, e) => {
  }
}, m = {
  1: ({ pbf: t }) => t.readBoolean(),
  2: ({ pbf: t }) => t.readDouble(),
  3: ({ pbf: t }) => t.readString(),
  5: (t) => {
    const { pbf: e } = t, i = e.readVarint(), n = new Array(i);
    for (let r = 0; r < i; r++)
      n[r] = T(t, e.readVarint());
    return n;
  },
  4: (t) => {
    const { pbf: e } = t, i = e.readVarint(), n = {};
    for (let s = 0; s < i; s++) {
      var r = e.readVarint();
      n[t.keys[r >> 3]] = T(t, r & 7);
    }
    return n;
  },
  6: (t) => null
}, xt = {
  boolean: 1,
  number: 2,
  string: 3,
  object: 4,
  array: 5,
  null: 6
  /* Null */
};
function v(t, e, i = 0) {
  const { pbf: n } = e;
  let r = typeof t;
  t === null && (r = "null"), Array.isArray(t) && (r = "array");
  const s = xt[r], o = P[s];
  if (!o)
    throw new Error(`Type ${typeof t} is not supported`);
  return dt(n, i, s), o(e, t), n;
}
function T(t, e) {
  const i = t.pbf;
  if (i.pos < i.length) {
    const n = m[e];
    if (!n)
      throw new Error(`Type ${e} is not supported`);
    return n(t);
  }
}
function R(t, e) {
  const i = Object.keys(t).length;
  e.writeVarint(i);
  for (const n in t)
    e.writeString(n), e.writeVarint(t[n]);
}
function b(t) {
  const e = t.readVarint(), i = [];
  for (let n = 0; n < e; n++) {
    const r = t.readString(), s = t.readVarint();
    i.push({ key: r, type: s });
  }
  return i;
}
function ct(t, e) {
  var u;
  const i = (e == null ? void 0 : e.pbf) ?? new G(), n = (e == null ? void 0 : e.method) ?? 1, r = e == null ? void 0 : e.columns;
  i.writeFixed32($ << 24 | n << 16);
  const s = [], f = { pbf: i, strings: s, stringMap: {} };
  switch (n) {
    case 1:
      const x = i.pos;
      i.writeFixed32(0), v(t, f);
      const a = i.pos;
      i.pos = x, i.writeFixed32(a), i.pos = a, i.writeVarint(s.length);
      for (const w of s)
        i.writeString(w);
      break;
    case 2:
      if (!r)
        throw new Error("No columns");
      const c = Object.keys(t)[0], F = (u = t == null ? void 0 : t[c]) == null ? void 0 : u.length;
      if (!F)
        throw new Error("Cannot determine columnar data length");
      i.writeFixed32(F), R(r, i);
      for (const w in r) {
        const g = r[w], p = P[g], l = t[w];
        for (const S of l)
          p(f, S);
      }
      break;
    case 3:
      if (!r)
        throw new Error("No columns");
      const d = t == null ? void 0 : t.length;
      if (!d)
        throw new Error("Cannot determine columnar data length");
      i.writeFixed32(d), R(r, i);
      for (const w in r) {
        const g = r[w], p = P[g];
        for (const l of t)
          p(f, l[w]);
      }
      break;
    default:
      throw new Error(`Method ${n} is not supported`);
  }
  return i.buf.slice(0, i.pos).buffer;
}
function wt(t, e) {
  if (!t || !t.byteLength || t.byteLength < 4)
    throw new Error("Bad array or insufficient array length.");
  const i = new G(t), n = i.readFixed32(), r = n >> 24 & 255;
  if (r > $)
    throw new Error(`Version ${r} is not supported`);
  const s = n >> 16 & 255, o = (e == null ? void 0 : e.method) ?? 1;
  if (s === 1 && o !== 1)
    throw new Error("Packed with PackMethod.Generic cannot be unpacked with anything than UnpackMethod.Generic");
  switch (o) {
    case 1:
      const f = i.readFixed32();
      if (f >= t.byteLength)
        return;
      const u = i.pos;
      i.pos = f;
      const x = i.readVarint(), a = new Array(x);
      for (let d = 0; d < x; d++)
        a[d] = i.readString();
      i.pos = u;
      const c = i.readVarint();
      return T({ keys: a, pbf: i }, c);
    case 2: {
      const d = { keys: [], pbf: i }, w = i.readFixed32(), g = b(i), p = {};
      for (const { key: l, type: S } of g) {
        const C = m[S], V = [];
        for (let j = 0; j < w; j++)
          V.push(C(d));
        p[l] = V;
      }
      return p;
    }
    case 3: {
      const d = { keys: [], pbf: i }, w = i.readFixed32(), g = b(i), p = new Array(w);
      for (let l = 0; l < w; l++)
        p[l] = {};
      for (const { key: l, type: S } of g) {
        const C = m[S];
        for (let V = 0; V < w; V++)
          p[V][l] = C(d);
      }
      return p;
    }
    default:
      throw new Error(`Method ${o} is not supported`);
  }
}
export {
  ht as JsonType,
  ft as PackMethod,
  at as UnpackMethod,
  ct as packJson,
  wt as unpackJson
};
