import { version } from '../package.json'

export const APP_VERSION = version
export const APP_VERSION_NAME = 'Polaris'
export const APP_VERSION_STAGE = 'Beta'
export const APP_VERSION_LABEL = `V${version.split('.')[0]} ${APP_VERSION_NAME} ${APP_VERSION_STAGE} (${version})`
