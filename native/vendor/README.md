clay.h, clay_renderer_SDL3.c: nicbarker/clay at e6cc369 (zlib, LICENSE.md). The renderer's include of clay.h made local; nothing else changed.
fonts/Roboto-Regular.ttf: from clay's examples/SDL3-simple-demo (Apache-2.0, Google Fonts).
thorvg: not vendored; brew `thorvg` 1.1.3 (MIT), C API `thorvg_capi.h`, built `-Dengines=cpu`: the software engine only (`tvg_glcanvas_create` and `tvg_wgcanvas_create` return NULL).
hershey/futural.jhf, hershey/cyrilc_1.jhf: kamalmostafa/hershey-fonts at 1356bf2 (the Hershey font data: free to use, change and redistribute, acknowledgements with the data; the block is in hershey/README.md). The spike's data only — nothing in the renderer reads it.
