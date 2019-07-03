import { Versions } from './versions'
import { isValidUrl } from './utils'
import { IDataPayloadMap, TDataPayload } from './interface'

export const getDataPayloadVersion = (jsonObj: object): Versions =>
  jsonObj ? (jsonObj as { version: Versions }).version : undefined

export const parseDataPayload = (
  json: string,
  _throw: 'throw' | undefined = undefined,
  version?: Versions,
): { data: TDataPayload; version: Versions } | undefined => {
  try {
    const j = JSON.parse(json)
    version = version || getDataPayloadVersion(j)

    switch (version) {
      case 1:
        const data = { misc: {}, ...(j as IDataPayloadMap[1]) }

        if (!data.name || !data.imageUrl || data.version != version) {
          throw new Error('Invalid payload.')
        }

        if (data.name.length > 128) {
          throw new Error('Item name is too long.')
        }

        if (!isValidUrl(data.imageUrl)) {
          throw new Error('Invalid image url.')
        }

        if (Object.values(data.misc).any(x => typeof x === 'object')) {
          throw new Error('Invalid misc. No internal objects allowed.')
        }

        return { data, version }
      default:
        throw new Error(`Version ${version} is no supported.`)
    }
  } catch (ex) {
    if (_throw) throw ex
    return undefined
  }
}
