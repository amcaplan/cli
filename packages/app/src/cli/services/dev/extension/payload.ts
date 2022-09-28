import {getLocalization} from './localization.js'
import {Capabilities, UIExtensionPayload} from './payload/models.js'
import {getUIExtensionResourceURL, getUIExtensionSurface} from '../../../utilities/extensions/configuration.js'
import {mapExtensionTypeToExternalExtensionType} from '../../../utilities/extensions/name-mapper.js'
import {ExtensionDevOptions} from '../extension.js'
import {UIExtension} from '../../../models/app/extensions.js'
import {getUIExtensionRendererVersion} from '../../../models/app/app.js'
import {string, file} from '@shopify/cli-kit'

type GetUIExtensionPayloadOptions = ExtensionDevOptions & {
  currentDevelopmentPayload?: Partial<UIExtensionPayload['development']>
  currentLocalizationPayload?: UIExtensionPayload['localization']
}

export async function getUIExtensionPayload(
  extension: UIExtension,
  options: GetUIExtensionPayloadOptions,
): Promise<UIExtensionPayload> {
  const url = `${options.url}/extensions/${extension.devUUID}`
  const configurationCapabilities = extension.configuration.capabilities
    ? Object.entries(extension.configuration.capabilities).reduce((acc, [key, value]) => {
        acc[string.camelize(key)] = value as boolean
        return acc
      }, {} as Capabilities)
    : {}
  const capabilities = {
    blockProgress: false,
    networkAccess: false,
    ...configurationCapabilities,
  }

  const {localization, status: localizationStatus} = await getLocalization(
    extension,
    options.currentLocalizationPayload,
  )

  const renderer = await getUIExtensionRendererVersion(extension.configuration.type, options.app)
  return {
    assets: {
      main: {
        name: 'main',
        url: `${url}/assets/main.js`,
        lastUpdated: await file.lastUpdatedTimestamp(extension.outputBundlePath),
      },
    },
    capabilities,
    development: {
      ...options.currentDevelopmentPayload,
      resource: getUIExtensionResourceURL(extension.configuration.type, options),
      root: {
        url,
      },

      hidden: options.currentDevelopmentPayload?.hidden || false,
      localizationStatus,
      status: options.currentDevelopmentPayload?.status || 'success',
      ...(options.currentDevelopmentPayload || {status: 'success'}),
    },
    extensionPoints: extension.configuration.extensionPoints ?? null,
    localization: localization ?? null,
    metafields: extension.configuration.metafields.length === 0 ? null : extension.configuration.metafields,
    type: extension.configuration.type,

    externalType: mapExtensionTypeToExternalExtensionType(extension.configuration.type),
    uuid: extension.devUUID,

    surface: getUIExtensionSurface(extension.configuration.type),

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    version: renderer?.version,

    title: extension.configuration.name,
  }
}