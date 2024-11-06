function U(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var v = {};
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
v.read = function(t, e, i, n, r) {
  var s, o, f = r * 8 - n - 1, a = (1 << f) - 1, x = a >> 1, u = -7, d = i ? r - 1 : 0, l = i ? -1 : 1, w = t[e + d];
  for (d += l, s = w & (1 << -u) - 1, w >>= -u, u += f; u > 0; s = s * 256 + t[e + d], d += l, u -= 8)
    ;
  for (o = s & (1 << -u) - 1, s >>= -u, u += n; u > 0; o = o * 256 + t[e + d], d += l, u -= 8)
    ;
  if (s === 0)
    s = 1 - x;
  else {
    if (s === a)
      return o ? NaN : (w ? -1 : 1) * (1 / 0);
    o = o + Math.pow(2, n), s = s - x;
  }
  return (w ? -1 : 1) * o * Math.pow(2, s - n);
};
v.write = function(t, e, i, n, r, s) {
  var o, f, a, x = s * 8 - r - 1, u = (1 << x) - 1, d = u >> 1, l = r === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, w = n ? 0 : s - 1, c = n ? 1 : -1, F = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
  for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (f = isNaN(e) ? 1 : 0, o = u) : (o = Math.floor(Math.log(e) / Math.LN2), e * (a = Math.pow(2, -o)) < 1 && (o--, a *= 2), o + d >= 1 ? e += l / a : e += l * Math.pow(2, 1 - d), e * a >= 2 && (o++, a /= 2), o + d >= u ? (f = 0, o = u) : o + d >= 1 ? (f = (e * a - 1) * Math.pow(2, r), o = o + d) : (f = e * Math.pow(2, d - 1) * Math.pow(2, r), o = 0)); r >= 8; t[i + w] = f & 255, w += c, f /= 256, r -= 8)
    ;
  for (o = o << r | f, x += r; x > 0; t[i + w] = o & 255, w += c, o /= 256, x -= 8)
    ;
  t[i + w - c] |= F * 128;
};
var $ = h, S = v;
function h(t) {
  this.buf = ArrayBuffer.isView && ArrayBuffer.isView(t) ? t : new Uint8Array(t || 0), this.pos = 0, this.type = 0, this.length = this.buf.length;
}
h.Varint = 0;
h.Fixed64 = 1;
h.Bytes = 2;
h.Fixed32 = 5;
var D = 65536 * 65536, N = 1 / D, G = 12, I = typeof TextDecoder > "u" ? null : new TextDecoder("utf8");
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
    var t = M(this.buf, this.pos);
    return this.pos += 4, t;
  },
  readSFixed32: function() {
    var t = A(this.buf, this.pos);
    return this.pos += 4, t;
  },
  // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)
  readFixed64: function() {
    var t = M(this.buf, this.pos) + M(this.buf, this.pos + 4) * D;
    return this.pos += 8, t;
  },
  readSFixed64: function() {
    var t = M(this.buf, this.pos) + A(this.buf, this.pos + 4) * D;
    return this.pos += 8, t;
  },
  readFloat: function() {
    var t = S.read(this.buf, this.pos, !0, 23, 4);
    return this.pos += 4, t;
  },
  readDouble: function() {
    var t = S.read(this.buf, this.pos, !0, 52, 8);
    return this.pos += 8, t;
  },
  readVarint: function(t) {
    var e = this.buf, i, n;
    return n = e[this.pos++], i = n & 127, n < 128 || (n = e[this.pos++], i |= (n & 127) << 7, n < 128) || (n = e[this.pos++], i |= (n & 127) << 14, n < 128) || (n = e[this.pos++], i |= (n & 127) << 21, n < 128) ? i : (n = e[this.pos], i |= (n & 15) << 28, H(i, t, this));
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
    return this.pos = t, t - e >= G && I ? rt(this.buf, e, t) : it(this.buf, e, t);
  },
  readBytes: function() {
    var t = this.readVarint() + this.pos, e = this.buf.subarray(this.pos, t);
    return this.pos = t, e;
  },
  // verbose for performance reasons; doesn't affect gzipped size
  readPackedVarint: function(t, e) {
    if (this.type !== h.Bytes) return t.push(this.readVarint(e));
    var i = p(this);
    for (t = t || []; this.pos < i; ) t.push(this.readVarint(e));
    return t;
  },
  readPackedSVarint: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readSVarint());
    var e = p(this);
    for (t = t || []; this.pos < e; ) t.push(this.readSVarint());
    return t;
  },
  readPackedBoolean: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readBoolean());
    var e = p(this);
    for (t = t || []; this.pos < e; ) t.push(this.readBoolean());
    return t;
  },
  readPackedFloat: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readFloat());
    var e = p(this);
    for (t = t || []; this.pos < e; ) t.push(this.readFloat());
    return t;
  },
  readPackedDouble: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readDouble());
    var e = p(this);
    for (t = t || []; this.pos < e; ) t.push(this.readDouble());
    return t;
  },
  readPackedFixed32: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readFixed32());
    var e = p(this);
    for (t = t || []; this.pos < e; ) t.push(this.readFixed32());
    return t;
  },
  readPackedSFixed32: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readSFixed32());
    var e = p(this);
    for (t = t || []; this.pos < e; ) t.push(this.readSFixed32());
    return t;
  },
  readPackedFixed64: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readFixed64());
    var e = p(this);
    for (t = t || []; this.pos < e; ) t.push(this.readFixed64());
    return t;
  },
  readPackedSFixed64: function(t) {
    if (this.type !== h.Bytes) return t.push(this.readSFixed64());
    var e = p(this);
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
    this.realloc(8), k(this.buf, t & -1, this.pos), k(this.buf, Math.floor(t * N), this.pos + 4), this.pos += 8;
  },
  writeSFixed64: function(t) {
    this.realloc(8), k(this.buf, t & -1, this.pos), k(this.buf, Math.floor(t * N), this.pos + 4), this.pos += 8;
  },
  writeVarint: function(t) {
    if (t = +t || 0, t > 268435455 || t < 0) {
      K(t, this);
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
    this.pos = nt(this.buf, t, this.pos);
    var i = this.pos - e;
    i >= 128 && j(e, i, this), this.pos = e - 1, this.writeVarint(i), this.pos += i;
  },
  writeFloat: function(t) {
    this.realloc(4), S.write(this.buf, t, this.pos, !0, 23, 4), this.pos += 4;
  },
  writeDouble: function(t) {
    this.realloc(8), S.write(this.buf, t, this.pos, !0, 52, 8), this.pos += 8;
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
    n >= 128 && j(i, n, this), this.pos = i - 1, this.writeVarint(n), this.pos += n;
  },
  writeMessage: function(t, e, i) {
    this.writeTag(t, h.Bytes), this.writeRawMessage(e, i);
  },
  writePackedVarint: function(t, e) {
    e.length && this.writeMessage(t, L, e);
  },
  writePackedSVarint: function(t, e) {
    e.length && this.writeMessage(t, Q, e);
  },
  writePackedBoolean: function(t, e) {
    e.length && this.writeMessage(t, Z, e);
  },
  writePackedFloat: function(t, e) {
    e.length && this.writeMessage(t, W, e);
  },
  writePackedDouble: function(t, e) {
    e.length && this.writeMessage(t, Y, e);
  },
  writePackedFixed32: function(t, e) {
    e.length && this.writeMessage(t, q, e);
  },
  writePackedSFixed32: function(t, e) {
    e.length && this.writeMessage(t, J, e);
  },
  writePackedFixed64: function(t, e) {
    e.length && this.writeMessage(t, tt, e);
  },
  writePackedSFixed64: function(t, e) {
    e.length && this.writeMessage(t, et, e);
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
function H(t, e, i) {
  var n = i.buf, r, s;
  if (s = n[i.pos++], r = (s & 112) >> 4, s < 128 || (s = n[i.pos++], r |= (s & 127) << 3, s < 128) || (s = n[i.pos++], r |= (s & 127) << 10, s < 128) || (s = n[i.pos++], r |= (s & 127) << 17, s < 128) || (s = n[i.pos++], r |= (s & 127) << 24, s < 128) || (s = n[i.pos++], r |= (s & 1) << 31, s < 128)) return B(t, r, e);
  throw new Error("Expected varint not more than 10 bytes");
}
function p(t) {
  return t.type === h.Bytes ? t.readVarint() + t.pos : t.pos + 1;
}
function B(t, e, i) {
  return i ? e * 4294967296 + (t >>> 0) : (e >>> 0) * 4294967296 + (t >>> 0);
}
function K(t, e) {
  var i, n;
  if (t >= 0 ? (i = t % 4294967296 | 0, n = t / 4294967296 | 0) : (i = ~(-t % 4294967296), n = ~(-t / 4294967296), i ^ 4294967295 ? i = i + 1 | 0 : (i = 0, n = n + 1 | 0)), t >= 18446744073709552e3 || t < -18446744073709552e3)
    throw new Error("Given varint doesn't fit into 10 bytes");
  e.realloc(10), X(i, n, e), z(n, e);
}
function X(t, e, i) {
  i.buf[i.pos++] = t & 127 | 128, t >>>= 7, i.buf[i.pos++] = t & 127 | 128, t >>>= 7, i.buf[i.pos++] = t & 127 | 128, t >>>= 7, i.buf[i.pos++] = t & 127 | 128, t >>>= 7, i.buf[i.pos] = t & 127;
}
function z(t, e) {
  var i = (t & 7) << 4;
  e.buf[e.pos++] |= i | ((t >>>= 3) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127)))));
}
function j(t, e, i) {
  var n = e <= 16383 ? 1 : e <= 2097151 ? 2 : e <= 268435455 ? 3 : Math.floor(Math.log(e) / (Math.LN2 * 7));
  i.realloc(n);
  for (var r = i.pos - 1; r >= t; r--) i.buf[r + n] = i.buf[r];
}
function L(t, e) {
  for (var i = 0; i < t.length; i++) e.writeVarint(t[i]);
}
function Q(t, e) {
  for (var i = 0; i < t.length; i++) e.writeSVarint(t[i]);
}
function W(t, e) {
  for (var i = 0; i < t.length; i++) e.writeFloat(t[i]);
}
function Y(t, e) {
  for (var i = 0; i < t.length; i++) e.writeDouble(t[i]);
}
function Z(t, e) {
  for (var i = 0; i < t.length; i++) e.writeBoolean(t[i]);
}
function q(t, e) {
  for (var i = 0; i < t.length; i++) e.writeFixed32(t[i]);
}
function J(t, e) {
  for (var i = 0; i < t.length; i++) e.writeSFixed32(t[i]);
}
function tt(t, e) {
  for (var i = 0; i < t.length; i++) e.writeFixed64(t[i]);
}
function et(t, e) {
  for (var i = 0; i < t.length; i++) e.writeSFixed64(t[i]);
}
function M(t, e) {
  return (t[e] | t[e + 1] << 8 | t[e + 2] << 16) + t[e + 3] * 16777216;
}
function k(t, e, i) {
  t[i] = e, t[i + 1] = e >>> 8, t[i + 2] = e >>> 16, t[i + 3] = e >>> 24;
}
function A(t, e) {
  return (t[e] | t[e + 1] << 8 | t[e + 2] << 16) + (t[e + 3] << 24);
}
function it(t, e, i) {
  for (var n = "", r = e; r < i; ) {
    var s = t[r], o = null, f = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
    if (r + f > i) break;
    var a, x, u;
    f === 1 ? s < 128 && (o = s) : f === 2 ? (a = t[r + 1], (a & 192) === 128 && (o = (s & 31) << 6 | a & 63, o <= 127 && (o = null))) : f === 3 ? (a = t[r + 1], x = t[r + 2], (a & 192) === 128 && (x & 192) === 128 && (o = (s & 15) << 12 | (a & 63) << 6 | x & 63, (o <= 2047 || o >= 55296 && o <= 57343) && (o = null))) : f === 4 && (a = t[r + 1], x = t[r + 2], u = t[r + 3], (a & 192) === 128 && (x & 192) === 128 && (u & 192) === 128 && (o = (s & 15) << 18 | (a & 63) << 12 | (x & 63) << 6 | u & 63, (o <= 65535 || o >= 1114112) && (o = null))), o === null ? (o = 65533, f = 1) : o > 65535 && (o -= 65536, n += String.fromCharCode(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), n += String.fromCharCode(o), r += f;
  }
  return n;
}
function rt(t, e, i) {
  return I.decode(t.subarray(e, i));
}
function nt(t, e, i) {
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
const b = /* @__PURE__ */ U($), R = 1;
var st = /* @__PURE__ */ ((t) => (t[t.Boolean = 1] = "Boolean", t[t.Number = 2] = "Number", t[t.String = 3] = "String", t[t.Object = 4] = "Object", t[t.Array = 5] = "Array", t[t.Null = 6] = "Null", t))(st || {}), ot = /* @__PURE__ */ ((t) => (t[t.Generic = 1] = "Generic", t[t.Columnar = 2] = "Columnar", t[t.Row = 3] = "Row", t))(ot || {});
function ht(t, e) {
  let i = t.stringMap[e];
  return i === void 0 && (i = t.strings.length, t.strings.push(e), t.stringMap[e] = i), i;
}
function ft(t, e, i) {
  t.writeVarint(e << 3 | i);
}
const C = {
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
      P(e[r], t, ht(t, r));
    });
  },
  5: (t, e) => {
    const { pbf: i } = t, n = e.length;
    i.writeVarint(n);
    for (let r = 0; r < n; r++)
      P(e[r], t);
  },
  6: (t, e) => {
  }
}, E = {
  1: ({ pbf: t }) => t.readBoolean(),
  2: ({ pbf: t }) => t.readDouble(),
  3: ({ pbf: t }) => t.readString(),
  5: (t) => {
    const { pbf: e } = t, i = e.readVarint(), n = new Array(i);
    for (let r = 0; r < i; r++)
      n[r] = m(t, e.readVarint());
    return n;
  },
  4: (t) => {
    const { pbf: e } = t, i = e.readVarint(), n = {};
    for (let s = 0; s < i; s++) {
      var r = e.readVarint();
      n[t.keys[r >> 3]] = m(t, r & 7);
    }
    return n;
  },
  6: (t) => null
}, at = {
  boolean: 1,
  number: 2,
  string: 3,
  object: 4,
  array: 5,
  null: 6
  /* Null */
};
function P(t, e, i = 0) {
  const { pbf: n } = e;
  let r = typeof t;
  t === null && (r = "null"), Array.isArray(t) && (r = "array");
  const s = at[r], o = C[s];
  if (!o)
    throw new Error(`Type ${typeof t} is not supported`);
  return ft(n, i, s), o(e, t), n;
}
function m(t, e) {
  const i = t.pbf;
  if (i.pos < i.length) {
    const n = E[e];
    if (!n)
      throw new Error(`Type ${e} is not supported`);
    return n(t);
  }
}
function O(t, e) {
  const i = Object.keys(t).length;
  e.writeVarint(i);
  for (const n in t)
    e.writeString(n), e.writeVarint(t[n]);
}
function _(t) {
  const e = t.readVarint(), i = [];
  for (let n = 0; n < e; n++) {
    const r = t.readString(), s = t.readVarint();
    i.push({ key: r, type: s });
  }
  return i;
}
function ut(t, e) {
  var a;
  const i = (e == null ? void 0 : e.pbf) ?? new b(), n = (e == null ? void 0 : e.method) ?? 1, r = e == null ? void 0 : e.columns;
  i.writeFixed32(R << 24 | n << 16);
  const s = [], f = { pbf: i, strings: s, stringMap: {} };
  switch (n) {
    case 1:
      const x = i.pos;
      i.writeFixed32(0), P(t, f);
      const u = i.pos;
      i.pos = x, i.writeFixed32(u), i.pos = u, i.writeVarint(s.length);
      for (const c of s)
        i.writeString(c);
      break;
    case 2:
      if (!r)
        throw new Error("No columns");
      const d = Object.keys(t)[0], l = (a = t == null ? void 0 : t[d]) == null ? void 0 : a.length;
      if (!l)
        throw new Error("Cannot determine columnar data length");
      i.writeFixed32(l), O(r, i);
      for (const c in r) {
        const F = r[c], y = C[F], V = t[c];
        for (const g of V)
          y(f, g);
      }
      break;
    case 3:
      if (!r)
        throw new Error("No columns");
      const w = t == null ? void 0 : t.length;
      if (!w)
        throw new Error("Cannot determine columnar data length");
      i.writeFixed32(w), O(r, i);
      for (const c in r) {
        const F = r[c], y = C[F];
        for (const V of t)
          y(f, V[c]);
      }
      break;
    default:
      throw new Error(`Method ${n} is not supported`);
  }
  return i.buf.slice(0, i.pos).buffer;
}
function dt(t) {
  if (!t || !t.byteLength || t.byteLength < 4)
    throw new Error("Bad array or insufficient array length.");
  const e = new b(t), i = e.readFixed32(), n = i >> 24 & 255;
  if (n > R)
    throw new Error(`Version ${n} is not supported`);
  const r = i >> 16 & 255;
  switch (r) {
    case 1:
      const s = e.readFixed32();
      if (s >= t.byteLength)
        return;
      const o = e.pos;
      e.pos = s;
      const f = e.readVarint(), a = new Array(f);
      for (let d = 0; d < f; d++)
        a[d] = e.readString();
      e.pos = o;
      const x = e.readVarint();
      return m({ keys: a, pbf: e }, x);
    case 2: {
      const d = { keys: [], pbf: e }, l = e.readFixed32(), w = _(e), c = {};
      for (const { key: F, type: y } of w) {
        const V = E[y], g = [];
        for (let T = 0; T < l; T++)
          g.push(V(d));
        c[F] = g;
      }
      return c;
    }
    case 3: {
      const d = { keys: [], pbf: e }, l = e.readFixed32(), w = _(e), c = new Array(l);
      for (let F = 0; F < l; F++)
        c[F] = {};
      for (const { key: F, type: y } of w) {
        const V = E[y];
        for (let g = 0; g < l; g++)
          c[g][F] = V(d);
      }
      return c;
    }
    default:
      throw new Error(`Method ${r} is not supported`);
  }
}
export {
  st as JsonType,
  ot as PackMethod,
  ut as pack,
  dt as unpack
};
