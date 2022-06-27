// CLI
import {version as cliVersion} from '../package.json'
import {run, flush} from '@oclif/core'
import Bugsnag from '@bugsnag/js'
import {error as kitError, output} from '@shopify/cli-kit'

function runCLI() {
  output.initiateLogging({filename: 'shopify.cli.log'})
  // if (environment.local.isDebug()) {
  //   settings.debug = true
  // } else {
  Bugsnag.start({
    apiKey: '9e1e6889176fd0c795d5c659225e0fae',
    logger: null,
    appVersion: cliVersion,
    autoTrackSessions: false,
  })
  // }

  run(undefined, import.meta.url)
    .then(flush)
    .catch((error: Error): Promise<void | Error> => {
      if (error instanceof kitError.AbortSilent) {
        process.exit(1)
      }
      const kitMapper = kitError.mapper
      const kitHandle = kitError.handler
      // eslint-disable-next-line promise/no-nesting
      return kitMapper(error)
        .then(bugsnagHandle)
        .then((error: Error) => {
          return kitHandle(error)
        })
        .then(() => {
          process.exit(1)
        })
    })
}

const bugsnagHandle = async (errorToReport: Error): Promise<Error> => {
  // if (!settings.debug && kitError.shouldReport(errorToReport)) {
  let mappedError: Error
  // eslint-disable-next-line no-prototype-builtins
  if (Error.prototype.isPrototypeOf(errorToReport)) {
    mappedError = new Error(errorToReport.message)
    mappedError.stack = errorToReport?.stack?.replace(new RegExp('file:///', 'g'), '/')
  } else {
    mappedError = new Error(`Unknown error: ${JSON.stringify(errorToReport, null, 2)}`)
  }
  await new Promise((resolve, reject) => {
    console.log(mappedError.stack)
    console.log(process.cwd())
    Bugsnag.notify(mappedError, undefined, resolve)
  })
  // }
  return Promise.resolve(errorToReport)
}

export default runCLI
