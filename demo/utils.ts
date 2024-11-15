import { unpackJson } from "../src/json2pbf";

export function unpackAndBuildMap(data: ArrayBuffer, columnar = false) {
    const unpacked = unpackJson(data);
    const map = new Map();
    if (columnar) {
        console.log(unpacked)
        for (let i = 0; i < unpacked.id.length; i++) {
            const featureState = {
                hidden: unpacked.hidden[i]
            }
            map.set(unpacked.id[i], featureState);

        }
    } else {
        for (let i = 0; i < unpacked.length; i++) {
            const item = unpacked[i];
            const featureState = {
                hidden: item.hidden
            }
            map.set(item.id, featureState);
        }    
    }
    return map;
}
