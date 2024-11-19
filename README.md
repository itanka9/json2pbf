# json2pbf

Simple JSON <-> protobuf codec

## Install 

```bash
npm i -S git+https://github.com/itanka9/json2pbf.git
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

## License

This project is licensed under the MIT License.

