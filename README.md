# 🤘 WIP: shakehands

A website which uses your webcam to detect movement and if it detects enough movement it'll increase the volume of a youtube video.

## Build

I'm using parcel to build this site into a small static website.
You need to install parcel first and then run:

```bash
parcel build src/index.html --public-url="/"
```

Or for development mode, you can enable watch mode:
```bash
parcel src/index.html
```

The server will listen on `localhost:1234`.

TODO: Enhance readme.
