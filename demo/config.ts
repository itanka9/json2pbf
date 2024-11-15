import { packJson, unpackJson, PackMethod, JsonType } from "../src/json2pbf";
import { packBfsm, unpackBfsm } from "./bfsm";

function makeArray (length: number) {
    const arr: any[] = [];
    for (let i = 0; i < length; i++) {
        arr.push({ id: Math.trunc(Math.random() * 10 ** 9).toString(), hidden: Math.random() > 0.5 })
    }
    return arr;
}

function makeBfsmArray (length: number) {
    const arr: any[] = [];
    for (let i = 0; i < length; i++) {
        arr.push({ id: Math.trunc(Math.random() * 10 ** 9).toString(), hidden: Math.round(Math.random()) })
    }
    return arr;
}

function makeColArray (length: number) {
    const arr: any = { id: [], hidden: [] };
    for (let i = 0; i < length; i++) {
        arr.id.push(Math.trunc(Math.random() * 10 ** 9).toString());
        arr.hidden.push(Math.random() > 0.5)
    }
    return arr;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

type Codec = { name: string, makeArray: (length: number) => any, pack: (data: any) => any, unpack: (data: any) => any };

export const codecs: Codec[] = [
    {
        name: 'as is (no serialization)',
        pack: (data) => ({ data }),
        unpack: (data) => ({ data }),
        makeArray,
    },
    {
        name: 'string (JSON.stringify / JSON.parse)',
        pack: (data) => ({ data: JSON.stringify(data) }),
        unpack: (data) => ({ data: JSON.parse(data) }),
        makeArray,
    },
    {
        name: 'JSON.stringify + TextEncoder / JSON.parse + TextDecoder',
        pack: (data) => ({ data: encoder.encode(JSON.stringify(data)) }),
        unpack: (data) => {
            const hash = decoder.decode(data);
            return { data: JSON.parse(hash) };
        },
        makeArray
    },
    {
        name: 'json2pbf PackMethod.Generic',
        pack: (data) => ({ data: packJson(data) }),
        unpack: (data) => {
            const unpacked = unpackJson(data);
            return { data: unpacked };
        },
        makeArray
    },
    {
        name: 'json2pbf PackMethod.Row',
        pack: (data) => ({
            data: packJson(data, { method: PackMethod.Row, columns: { id: JsonType.String, hidden: JsonType.Boolean } })
        }),
        unpack: (data) => {
            const unpacked = unpackJson(data);
            return { data: unpacked };
        },
        makeArray
    },
    {
        name: 'json2pbf PackMethod.Columnar',
        pack: (data) => ({ data: packJson(data, { method: PackMethod.Columnar, columns: { id: JsonType.String, hidden: JsonType.Boolean } }) }), 
        unpack: (data) => {
            const unpacked = unpackJson(data);
            return { data: unpacked };
        },
        makeArray: makeColArray
    },
    {
        name: 'BFSM',
        pack: data => packBfsm(data),
        unpack: (data) => {
            const unpacked = unpackBfsm(data);
            return { data: unpacked };
        },
        makeArray: makeBfsmArray
    },
]