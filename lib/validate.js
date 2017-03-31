var cachedWhitelist
var whitelistRegExps = []
var protocolRegExp = /^(?:(?:https?|ftp):\/\/)/i

/**
 * Check a url against a whitelist of domains with optional paths
 * e.g. `valid.domain.com` or `valid.domain.com/valid/path`
 * any url that does not begin with that domain and path will be rejected.
 * Valid regular expression syntax is accepted
 * @param {string} url       url to validate
 * @param {array|string} whitelist Array or comma-separated list of valid domains/paths
 * @return {boolean} `true` if domain appears on whitelist
 */
module.exports = function (url, whitelist) {
  if (!whitelist) return true
  whitelist = typeof whitelist === 'string' ? whitelist.split(',') : whitelist || []
  // We cache compiled RegExps to speed things up
  if (whitelist !== cachedWhitelist) {
    whitelistRegExps = whitelist.map(function (domain) {
      // trim whitespace, remove protocol, and enforce trailing slash
      domain = domain.trim().replace(protocolRegExp, '').replace(/\/$/, '/')
      return new RegExp(protocolRegExp.source + domain, 'i')
    })
  }
  cachedWhitelist = whitelist
  return whitelistRegExps.reduce(function (p, v) {
    return p || v.test(url)
  }, false)
}
