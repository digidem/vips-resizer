var express = require('express')
var logger = require('morgan')
var request = require('request')
var sharp = require('sharp')
var pump = require('pump')
var debug = require('debug')('vips-resizer:app')

var validateUrl = require('./lib/validate')
var errorStatusCodes = require('./lib/errors')
var pathRegExp = require('./lib/path_regexp')

var app = express()

// Log error requests
app.use(logger('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}))

var WHITELIST = process.env.WHITELIST
var MAX_WIDTH = 4000
var MIN_WIDTH = 100
var MAX_HEIGHT = 4000
var MIN_HEIGHT = 100
var MAX_QUALITY = 90
var MAX_INPUT_PIXELS = 24 * 1000 * 1000 // 24MP
var REQUEST_TIMEOUT = 30 * 1000 // 30 seconds

app.get(pathRegExp, function (req, res, next) {
  var w = req.params[0] || MAX_WIDTH
  var h = req.params[1] || w
  var q = req.params[2] || 70
  var url = req.params[3]

  var isValidUrl = validateUrl(url, app.get('whitelist') || WHITELIST)
  if (!isValidUrl) {
    var err = new Error('Image domain is forbidden (does not match whitelist)')
    err.status = 403
    return next(err)
  }

  // Coerce to numbers + enforce limits
  w = w && Math.max(Math.min(+w, MAX_WIDTH), MIN_WIDTH)
  h = h && Math.max(Math.min(+h, MAX_HEIGHT), MIN_HEIGHT)
  q = q && Math.max(Math.min(+q, MAX_QUALITY), 1)

  var resizer = sharp()
    .resize(w, h)
    .max() // Preserving aspect ratio, resize the image to fit within `w` & `h`
    .withoutEnlargement() // Do not enlarge images smaller than `w` & `h`
    .rotate() // Rotate image according to EXIF metadata (e.g. images from phones)
    .quality(q) // JPEG quality setting
    .sequentialRead() // Set VIPS_ACCESS_SEQUENTIAL, reducing memory usage
    .limitInputPixels(MAX_INPUT_PIXELS) // Do not process images > MAX_INPUT_PIXELS
    .on('error', next)

  // TODO: pass querty string to request?
  // (query string will not be matched by path regexp)
  request(url, {timeout: REQUEST_TIMEOUT})
    .on('error', next)
    .on('response', function (response) {
      res.statusCode = response.statusCode
      if (response.statusCode !== 200) {
        var err = new Error('Image request returned status ' + response.statusCode)
        err.status = 400
        return next(err)
      }
      res.header('Content-Type', response.headers['content-type'])
      res.header('Cache-Control', 'public, max-age=31557600') // one year cache
      pump(response, resizer, res, function (err) {
        if (err) return next(err)
      })
    })
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  debug(err.stack)
  res.status(err.status || errorStatusCodes[err.message] || errorStatusCodes[err.code] || 500)
  res.send({
    error: err.message
  })
})

module.exports = app
