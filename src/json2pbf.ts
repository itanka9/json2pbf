import Pbf from 'pbf';

const VERSION = 1;

export enum JsonType {
    Boolean = 1,
    Number = 2,
    String = 3,
    Object = 4,
    Array = 5,
    Null = 6,
}

export enum PackMethod {
    Generic = 1,
    Columnar = 2,
    Row = 3
}

export enum UnpackMethod {
    Generic = 1,
    Columnar = 2,
    Row = 3,
}

interface PackCtx {
    pbf: typeof Pbf;
    stringMap: { [str: string]: number };
    strings: string[];
}

interface UnpackCtx {
    keys: string[];
    pbf: typeof Pbf;
}

function indexateString(ctx: PackCtx, key: string) {
    let i = ctx.stringMap[key];
    if (i === undefined) {
        i = ctx.strings.length;
        ctx.strings.push(key);
        ctx.stringMap[key] = i;
    }
    return i;
}

function writeTag(pbf: typeof Pbf, key: number, type: JsonType) {
    pbf.writeVarint((key << 3) | type);
}

const encoders: Record<JsonType, (ctx: PackCtx, value: any) => void> = {
    [JsonType.Boolean]: ({ pbf }: PackCtx, value: any) => { pbf.writeBoolean(value) },
    [JsonType.Number]: ({ pbf }: PackCtx, value: any) => { pbf.writeDouble(value) },
    [JsonType.String]: ({ pbf }: PackCtx, value: any) => { pbf.writeString(value) },
    [JsonType.Object]: (ctx: PackCtx, value: any) => {
        if (value === null) {
            return;
        }
        const { pbf } = ctx;
        const keys = Object.keys(value);
        pbf.writeVarint(keys.length);
        keys.forEach((key) => {
            toPbf(value[key], ctx, indexateString(ctx, key));
        });
    },
    [JsonType.Array]: (ctx: PackCtx, value: any) => {
        const { pbf } = ctx;
        const len = value.length;
        pbf.writeVarint(len);
        for (let i = 0; i < len; i++) {
            toPbf(value[i], ctx);
        }
    },
    [JsonType.Null]: (_ctx: PackCtx, _value: any) => {}
};

const decoders: Record<JsonType, (ctx: UnpackCtx) => any> = {
    [JsonType.Boolean]: ({ pbf }: UnpackCtx) => pbf.readBoolean(),
    [JsonType.Number]: ({ pbf }: UnpackCtx) => pbf.readDouble(),
    [JsonType.String]: ({ pbf }: UnpackCtx) => pbf.readString(),
    [JsonType.Array]: (ctx: UnpackCtx) => {
        const { pbf } = ctx;
        const len = pbf.readVarint();
        const arr = new Array<any>(len);
        for (let i = 0; i < len; i++) {
            arr[i] = fromPbf(ctx, pbf.readVarint());
        }
        return arr;
    },
    [JsonType.Object]: (ctx: UnpackCtx) => {
        const { pbf } = ctx;
        const len = pbf.readVarint();
        const obj: any = {};
        for (let i = 0; i < len; i++) {
            var val = pbf.readVarint();
            obj[ctx.keys[val >> 3]] = fromPbf(ctx, val & 0x7);
        }
        return obj;
    },
    [JsonType.Null]: (_ctx: UnpackCtx) => null
}

const typeToKey: Record<string, JsonType> = {
    boolean: JsonType.Boolean,
    number: JsonType.Number,
    string: JsonType.String,
    object: JsonType.Object,
    array: JsonType.Array,
    null: JsonType.Null
}


function toPbf(value: any, ctx: PackCtx, key = 0) {
    const { pbf } = ctx;
    let typeOf: string = typeof value;
    if (value === null) {
        typeOf = 'null';
    }
    if (Array.isArray(value)) {
        typeOf = 'array';
    }
    const jsonType = typeToKey[typeOf];
    const encoder = encoders[jsonType];
    if (!encoder) {
        throw new Error(`Type ${typeof value} is not supported`);
    }
    writeTag(pbf, key, jsonType);
    encoder(ctx, value);
    return pbf;
}


function fromPbf(ctx: UnpackCtx, type: JsonType) {
    const pbf = ctx.pbf;
    if (pbf.pos < pbf.length) {
        const decoder = decoders[type];
        if (!decoder) {
            throw new Error(`Type ${type} is not supported`);
        }
        return decoder(ctx);
    }
}
function writeColumns(columns: Record<string, JsonType>, pbf: typeof Pbf) {
    const length = Object.keys(columns).length;
    pbf.writeVarint(length);
    for (const k in columns) {
        pbf.writeString(k);
        pbf.writeVarint(columns[k]);
    }    
}

function readColumns(pbf: typeof Pbf) {
    const length = pbf.readVarint();
    const columns: Array<{ key: string, type: JsonType }> = [];
    for (let i = 0; i < length; i++) {
        const key = pbf.readString();
        const type = pbf.readVarint();
        columns.push({ key, type });
    }
    return columns;
}

export interface PackOptions {
    pbf?: typeof Pbf,
    method?: PackMethod,
    columns?: Record<string, JsonType>
}

export function packJson(val: any, options?: PackOptions): ArrayBuffer {
    const pbf = options?.pbf ?? new Pbf();
    const method = options?.method ?? PackMethod.Generic;
    const columns = options?.columns;
    
    pbf.writeFixed32(VERSION << 24 | method << 16);

    const strings: any[] = [];
    const stringMap: Record<string, number> = {};
    const ctx: PackCtx = { pbf, strings, stringMap };

    switch (method) {
        case PackMethod.Generic:
            const keysPos = pbf.pos;
            pbf.writeFixed32(0);
        
            toPbf(val, ctx);

            const keysOffset = pbf.pos;
            pbf.pos = keysPos;
            pbf.writeFixed32(keysOffset);
            pbf.pos = keysOffset;
        
            pbf.writeVarint(strings.length);
            for (const s of strings) {
                pbf.writeString(s);
            }
            break;
        case PackMethod.Columnar:
            if (!columns) {
                throw new Error('No columns');
            }
            const fcol = Object.keys(val)[0];
            const clen = val?.[fcol]?.length;
            if (!clen) {
                throw new Error('Cannot determine columnar data length');
            }
            pbf.writeFixed32(clen);
            writeColumns(columns, pbf);
            for (const col in columns) {
                const jsonType = columns[col];
                const encoder = encoders[jsonType];
                const data = val[col];
                for (const item of data) {
                    encoder(ctx, item);
                }
            }
            break;
        case PackMethod.Row:
            if (!columns) {
                throw new Error('No columns');
            }
            const rlen = val?.length;
            if (!rlen) {
                throw new Error('Cannot determine columnar data length');
            }
            pbf.writeFixed32(rlen);
            writeColumns(columns, pbf);
            for (const col in columns) {
                const jsonType = columns[col];
                const encoder = encoders[jsonType];
                for (const item of val) {
                    encoder(ctx, item[col]);
                }
            }
            break;    
        default:
            throw new Error(`Method ${method} is not supported`);        
    }    
    return pbf.buf.slice(0, pbf.pos).buffer;
}

export interface UnpackOptions {
    method?: UnpackMethod,
}

export function unpackJson(arr: ArrayBuffer, options?: UnpackOptions) {
    if (!arr || !arr.byteLength || arr.byteLength < 4) {
        throw new Error('Bad array or insufficient array length.')
    }
    const pbf = new Pbf(arr);

    const header = pbf.readFixed32();
    const version = (header >> 24) & 0xff;
    if (version > VERSION) {
        throw new Error(`Version ${version} is not supported`);
    }
    const packMethod: PackMethod = (header >> 16) & 0xff;
    const unpackMethod: UnpackMethod = options?.method ?? UnpackMethod.Generic;

    if (packMethod === PackMethod.Generic && unpackMethod !== UnpackMethod.Generic) {
        throw new Error('Packed with PackMethod.Generic cannot be unpacked with anything than UnpackMethod.Generic');
    }

    switch (unpackMethod) {
        case UnpackMethod.Generic:
            const keysOffset = pbf.readFixed32();
            if (keysOffset >= arr.byteLength) {
                return;
            }
        
            const dataPos = pbf.pos;
            pbf.pos = keysOffset;
            const keysCount = pbf.readVarint();
            const keys = new Array<string>(keysCount);
            for (let i = 0; i < keysCount; i++) {
                keys[i] = pbf.readString();
            }
        
            pbf.pos = dataPos;
            const startType = pbf.readVarint();
            const ctx: UnpackCtx = { keys, pbf };
            return fromPbf(ctx, startType);        
        case UnpackMethod.Columnar: {
            const ctx: UnpackCtx = { keys: [], pbf };
            const len = pbf.readFixed32();
            const columns = readColumns(pbf);
            const result: any = {};
            for (const { key, type } of columns) {
                const decoder = decoders[type];
                const data: any[] = [];
                for (let i = 0; i < len; i++) {
                    data.push(decoder(ctx));
                }
                result[key] = data;
            }
            return result;
        }
        case UnpackMethod.Row: {
            const ctx: UnpackCtx = { keys: [], pbf };
            const len = pbf.readFixed32();
            const columns = readColumns(pbf);
            const result: any[] = new Array(len);
            for (let i = 0; i < len; i++) {
                result[i] = {};
            }
            for (const { key, type } of columns) {
                const decoder = decoders[type];
                for (let i = 0; i < len; i++) {
                    result[i][key] = decoder(ctx);
                }
            }
            return result;
        }
        default:
            throw new Error(`Method ${unpackMethod} is not supported`);   
    }
}
