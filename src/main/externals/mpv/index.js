import { join } from 'path'

import { getPluginEntry } from 'mpv.js'

/**
 * Configure app to use MPV player.
 *
 * @param {import('electron').App} app
 */
export default function (app) {
  // Absolute path to the plugin directory.
  const pluginDir = join(__dirname, '..', 'node_modules', 'mpv.js', 'build', 'Release')
  console.log(pluginDir)

  // See pitfalls section for details.
  if (process.platform !== 'linux') process.chdir(pluginDir)

  // To support a broader number of systems.
  app.commandLine.appendSwitch('ignore-gpu-blacklist')
  app.commandLine.appendSwitch('register-pepper-plugins', getPluginEntry(pluginDir))
}
