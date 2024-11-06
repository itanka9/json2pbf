interface BinaryFeatureStateAttribute {
    buffer: ArrayBuffer;
    stride: number;
    offset: number;
}

interface BinaryFeatureStateMap {
    size: number;
    attributes: {
        id: BinaryFeatureStateAttribute;
        [name: string]: BinaryFeatureStateAttribute;
    };
}

export function packBfsm(items: any[]): { data: BinaryFeatureStateMap, transfer: ArrayBuffer[] } {
    // ID у нас uint64, поэтому его размер в байтах равен 8
  const idByteLength = 8;

  // Другие атрибуты мы храним во float32 – их размер в байтах равен 4
  const attributeByteLength = 4;

  const stride = idByteLength + attributeByteLength;
  const byteLength = stride * items.length;
  const buffer = new ArrayBuffer(byteLength);

  let attributeByteOffset = 0;

  const attributes: BinaryFeatureStateMap['attributes'] = {
    id: {
      buffer,
      stride,
      offset: attributeByteOffset,
    },
  };

  attributeByteOffset += idByteLength;

  attributes['hidden'] = {
    buffer,
    stride,
    offset: attributeByteOffset,
  };

  attributeByteOffset += attributeByteLength;

  const featureStateMap: BinaryFeatureStateMap = {
    attributes,
    size: items.length,
  };

  // Теперь заполняем данными наш буфер
  const view = new DataView(buffer);
  let byteOffset = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const id = BigInt(+item['id']);
    view.setBigUint64(byteOffset, id, true);
    byteOffset += idByteLength;

    view.setFloat32(byteOffset, item['hidden'], true);
    byteOffset += attributeByteLength;
  }

  return {
    data: featureStateMap,
    transfer: [buffer],
  };
}

export function unpackBfsm(binaryMap: BinaryFeatureStateMap): Map<string, Record<string, any>> {
    const result = new Map<string, Record<string, any>>();

    const { attributes, size } = binaryMap;

    const idAttribute = {
        stride: attributes.id.stride,
        view: new Uint32Array(attributes.id.buffer, attributes.id.offset),
    };

    const otherAttributes: Array<{
        name: keyof BinaryFeatureStateMap['attributes'];
        stride: number;
        view: Float32Array;
    }> = [];

    for (const attributeName in binaryMap.attributes) {
        if (attributeName !== 'id') {
            const { stride, buffer, offset } = binaryMap.attributes[attributeName];

            otherAttributes.push({
                name: attributeName,
                stride,
                view: new Float32Array(buffer, offset),
            });
        }
    }

    for (let i = 0; i < size; i++) {
        // TODO https://jira.2gis.ru/browse/TILES-6351 Поддержать строковые идентификаторы, сейчас работает только с внутренними id карты
        const id = 
            String(idAttribute.view[(i * idAttribute.stride) / 4]) +
            String(idAttribute.view[(i * idAttribute.stride) / 4 + 1]);

        const featureState = {};
        for (const attribute of otherAttributes) {
            const value = attribute.view[(i * attribute.stride) / 4];
            featureState[attribute.name] = !Number.isNaN(value) ? value : null;
        }
        result.set(id, featureState);
    }

    return result;
}
