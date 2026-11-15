import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

export const name = 'paperlocus'
export const PACKAGE_NAME = 'dsh-paperlocus'

/**
 * Resolve the Skill root bundled with this package, from the DSH profile's
 * module resolution root.
 *
 * `cordis.patch.yml` performs the same resolution inline (the patch is
 * evaluated with `baseUrl` in scope and cannot import from here); this export
 * exists so the same contract can be unit-tested and reused by embedders that
 * want to mount the Skill root through their own provider row.
 *
 * @param {string} profileBaseUrl - the DSH profile base URL / directory the Loader anchored on.
 * @returns {string} absolute path of the packaged `skills` directory.
 * @throws {Error} when `profileBaseUrl` is missing or the package cannot be resolved from it.
 */
export function resolvePaperlocusSkillRoot(profileBaseUrl) {
  if (!profileBaseUrl) {
    throw new Error('dsh-paperlocus: missing DSH profile baseUrl for package resolution')
  }
  let manifestPath
  try {
    manifestPath = createRequire(profileBaseUrl).resolve(`${PACKAGE_NAME}/package.json`)
  } catch (error) {
    throw new Error(
      `dsh-paperlocus: cannot resolve ${PACKAGE_NAME}/package.json from the DSH profile`,
      { cause: error },
    )
  }
  return join(dirname(manifestPath), 'skills')
}
