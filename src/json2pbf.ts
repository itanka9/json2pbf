import Pbf from 'pbf';

enum ValueTypes {
    undefined = 0,
    boolean = 1,
    varint = 2,
    double = 3,
    string = 4,
    null = 5,
    object = 6,
    array = 7,
}

interface JsonToPBFPackContext {
    pbf: Pbf;
    keys: { [key: string]: number };
    keysArr: string[];
    index: number;
}

interface JsonToPBFUnpackContext {
    keys: string[];
    pbf: Pbf;
}

function getKeyIndex(ctx: JsonToPBFPackContext, key: string) {
    let i = ctx.keys[key];
    if (i === undefined) {
        i = ctx.index;
        ctx.keys[key] = i;
        ctx.index++;
        ctx.keysArr.push(key);
    }
    return i;
}

function writeTag(pbf: Pbf, key: number, type: ValueTypes) {
    pbf.writeVarint((key << 3) | type);
}

function jsonToPBF(value: any, ctx: JsonToPBFPackContext, key = 0) {
    const pbf = ctx.pbf;
    switch (typeof value) {
        case 'boolean':
            writeTag(pbf, key, ValueTypes.boolean);
            pbf.writeBoolean(value);
            break;
        case 'number':
            if (value % 1 === 0) {
                writeTag(pbf, key, ValueTypes.varint);
                pbf.writeSVarint(value);
            } else {
                writeTag(pbf, key, ValueTypes.double);
                pbf.writeDouble(value);
            }
            break;
        case 'string':
            writeTag(pbf, key, ValueTypes.string);
            pbf.writeString(value);
            break;
        case 'object': {
            if (value === null) {
                writeTag(pbf, key, ValueTypes.null);
            } else if (Array.isArray(value)) {
                writeTag(pbf, key, ValueTypes.array);
                const len = value.length;
                pbf.writeVarint(len);
                for (let i = 0; i < len; i++) {
                    jsonToPBF(value[i], ctx);
                }
            } else {
                writeTag(pbf, key, ValueTypes.object);
                const keys = Object.keys(value);
                pbf.writeVarint(keys.length);
                keys.forEach((key) => {
                    jsonToPBF(value[key], ctx, getKeyIndex(ctx, key));
                });
            }

            break;
        }
        default:
            writeTag(pbf, key, ValueTypes.undefined);
            break;
    }
    return pbf;
}

function jsonFromPBF(ctx: JsonToPBFUnpackContext, type: ValueTypes) {
    const pbf = ctx.pbf;
    if (pbf.pos < pbf.length) {
        switch (type) {
            case ValueTypes.array: {
                const len = pbf.readVarint();
                const arr = new Array<any>(len);
                for (let i = 0; i < len; i++) {
                    arr[i] = jsonFromPBF(ctx, pbf.readVarint());
                }
                return arr;
            }
            case ValueTypes.boolean: {
                return pbf.readBoolean();
            }
            case ValueTypes.null: {
                return null;
            }
            case ValueTypes.double: {
                return pbf.readDouble();
            }
            case ValueTypes.varint: {
                return pbf.readSVarint(true);
            }
            case ValueTypes.object: {
                const len = pbf.readVarint();
                const obj = {};
                for (let i = 0; i < len; i++) {
                    var val = pbf.readVarint();
                    obj[ctx.keys[val >> 3]] = jsonFromPBF(ctx, val & 0x7);
                }
                return obj;
            }
            case ValueTypes.string: {
                return pbf.readString();
            }
            default:
                return undefined;
        }
    }
}

export function packJson(val: any, pbf?: Pbf): ArrayBuffer {
    if (!pbf) {
        pbf = new Pbf();
    }
    pbf.pos = 0;
    pbf.writeFixed32(0);
    const keysArr = [];
    const ctx: JsonToPBFPackContext = { pbf, keys: {}, keysArr, index: 0 };
    jsonToPBF(val, ctx);
    const keysOffset = pbf.pos;
    pbf.pos = 0;
    pbf.writeFixed32(keysOffset);
    pbf.pos = keysOffset;

    pbf.writeVarint(keysArr.length);
    keysArr.forEach((key) => {
        pbf.writeString(key);
    });
    const pos = pbf.pos;
    pbf.pos = 0;
    return pbf.buf.slice(0, pos).buffer;
}

export function unpackJson(arr: ArrayBuffer) {
    if (arr.byteLength < 4) {
        return;
    }
    const pbf = new Pbf(arr);
    const keysOffset = pbf.readFixed32();
    if (keysOffset >= arr.byteLength) {
        return;
    }

    pbf.pos = keysOffset;
    const keysCount = pbf.readVarint();
    const keys = new Array<string>(keysCount);
    for (let i = 0; i < keysCount; i++) {
        keys[i] = pbf.readString();
    }

    pbf.pos = 4;
    const startType = pbf.readVarint();
    return jsonFromPBF({ keys, pbf }, startType);
}

// const TIMES = 10000;
// const jsonTemplate = [2, 769, 0.00000011, NaN, NaN, 10000, '#ffffff', true, '#ff0000', null];

// function makeTest<T>(title: string, packFn: (json: any) => T, unpackFn: (buf: T) => any) {
//     let json: any = jsonTemplate;
//     let buf: T;
//     let i: number = 0;
//     title = `${title} (${TIMES} запусков)`;
//     console.group(title);
//     console.time('pack');
//     i = TIMES - 1;
//     buf = packFn(json);
//     while (i--) {
//         buf = packFn(json);
//     }
//     console.timeEnd('pack');
//     console.log(buf);

//     console.time('unpack');
//     i = TIMES;
//     while (i--) {
//         json = unpackFn(buf);
//     }
//     console.timeEnd('unpack');
//     console.log(json);
//     console.groupEnd();
// }

// window.setTimeout(function () {
//     console.group('TEMPLATE');
//     console.log(jsonTemplate);
//     console.groupEnd();
//     const encoder = new TextEncoder();
//     const decoder = new TextDecoder('utf-8');
//     makeTest(
//         'JSON.stringify + TextEncoder',
//         (json: any) => {
//             return encoder.encode(JSON.stringify(json)).buffer;
//         },
//         (buf: ArrayBuffer) => {
//             const arr = JSON.parse(decoder.decode(buf));
//             arr.forEach((v, i) => {
//                 if (v === null) {
//                     arr[i] = NaN;
//                 }
//             });
//             return arr;
//         },
//     );

//     const pbf = new Pbf();

//     makeTest(
//         'PBF',
//         (json: any) => {
//             return packJson(json, pbf);
//         },
//         (buf: ArrayBuffer) => {
//             return unpackJson(buf);
//         },
//     );

//     makeTest<any[]>(
//         'array',
//         (json: any[]) => {
//             return json.slice();
//         },
//         (buf: any[]) => {
//             return buf.slice();
//         },
//     );
// }, 500);

// function compact(json) {
//     let last = [0, 0];
//     function packPoint(pnt) {
//         for (let i = 0; i < 2; i++) {
//             const c = Math.round(pnt[i] * 1e6);
//             pnt[i] = c - last[i];
//             last[i] = c;
//         }
//     }

//     json.features.forEach((f) => {
//         if (f.geometry.type === 'Polygon') {
//             f.geometry.coordinates.forEach((ring) => ring.forEach(packPoint));
//         } else if (f.geometry.type === 'MultiPolygon') {
//             f.geometry.coordinates.forEach((part) =>
//                 part.forEach((ring) => ring.forEach(packPoint)),
//             );
//         }
//     });
// }

// function uncompact(json) {
//     let last = [0, 0];
//     function packPoint(pnt) {
//         for (let i = 0; i < 2; i++) {
//             const c = pnt[i] / 1e6;
//             pnt[i] = c + last[i];
//         }
//         last = pnt;
//     }

//     json.features.forEach((f) => {
//         if (f.geometry.type === 'Polygon') {
//             f.geometry.coordinates.forEach((ring) => ring.forEach(packPoint));
//         } else if (f.geometry.type === 'MultiPolygon') {
//             f.geometry.coordinates.forEach((part) =>
//                 part.forEach((ring) => ring.forEach(packPoint)),
//             );
//         }
//     });
// }
