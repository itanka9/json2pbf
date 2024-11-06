declare module "json2pbf" {
    import Pbf from 'pbf';
    export enum JsonType {
        Boolean = 1,
        Number = 2,
        String = 3,
        Object = 4,
        Array = 5,
        Null = 6
    }
    export enum PackMethod {
        Generic = 1,
        Columnar = 2,
        Row = 3
    }
    export interface PackOptions {
        pbf?: typeof Pbf;
        method?: PackMethod;
        columns?: Record<string, JsonType>;
    }
    export function pack(val: any, options?: PackOptions): ArrayBuffer;
    export function unpack(arr: ArrayBuffer): any;
}
