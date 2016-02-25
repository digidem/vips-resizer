// Match err.message & err.code to correct HTTP response code
module.exports = {
  'Input image exceeds pixel limit': 413,
  'ETIMEDOUT': 408,
  'Input buffer contains unsupported image format': 415
}
