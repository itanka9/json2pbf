# json2pbf

Simple JSON <-> protobuf codec

## Install 

```bash
npm i -S @2gis/json2pbf
```

## Usage

Simple usage

```js
import { packJson, unpackJson } from 'json2pbf';

const json = { foo: ['bar', 'baz'] }

const packed = packJson(json);

const unpacked = unpackJson(packed);

```

## Row and columnar data

TBD

## Development

Install deps

```bash
npm i
```

To start the demo server, run:

```
npm start
```

Build

```
npm run build
```

## Publish 

```
npm version  patch | minor | major
npm run build
npm publish --access=public
```

## License

This project is licensed under the MIT License.

