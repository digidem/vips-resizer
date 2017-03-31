# vips-resizer

Fast streaming image resizer API using libvips on node

## Install

```sh
git clone https://github.com/digidem/vips-resizer
cd vips-resizer
npm install
```

## Start

By default this will resize images from any domain. To only allow images from certain domains to be resized, pass a comma-separated list of whitelisted URLs from which to process images. E.g.

```sh
WHITELIST="mydomain.com,s3.amazonaws.com/mybucket" npm start
```

## API

### GET `/[width/][height/][quality/]imageUrl`

Resize an image to fit within `width` and `height` at `quality`. If `height` is omitted it is the same as `width`. If `quality` is omitted the default is `70`. If `width`, `height` and `quality` are omitted they default to `MAX_WIDTH` which is 4000px by default.

`image_url` should include the protocol e.g. `http://example.com/myimage.jpg`
