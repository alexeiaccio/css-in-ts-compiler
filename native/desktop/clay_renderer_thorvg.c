// Clay's render commands on ThorVG's software canvas: each frame is a new scene of shapes and texts, drawn into a
// 32-bit buffer (ABGR8888: R,G,B,A bytes in memory, as SDL's RGBA32). Text is measured with ThorVG too, so what Clay
// lays out is what is drawn: the width is the sum of glyph advances (ThorVG 1.1 applies no kerning), the height the
// font's line advance.
#include <math.h>
#include <thorvg_capi.h>

typedef struct {
    Tvg_Canvas canvas;
    float scale;        // device pixels per Clay unit (the window's pixel density); the buffer is that much larger
    const char **fonts; // ThorVG font names by fontId (tvg_font_load names a font by its file name, no extension)
    Tvg_Paint measurer; // a text paint for Clay_ThorVG_MeasureText
    bool clear;         // draw into a target whose last frame is gone (a swapchain): clear it, not just overdraw it
    // an image's picture, by the imageData it was loaded from: a cssints/clay image carries the path in that pointer
    struct {
        const void *imageData;
        Tvg_Paint picture;
    } images[32];
    int imageCount;
    // the frame's shadows (css.shadow), by the id of the element that casts one: no Clay field holds a shadow, so the
    // host sets them beside the declaration and the command stream's id finds them again here
    struct {
        uint32_t id; // Clay_ElementId.id of the element
        float x, y, blur;
        Clay_Color color;
        bool drawn;
    } shadows[32];
    int shadowCount;
    // the frame's backdrops (css.backdrop), by the id of the element that has one: the same ride-along as a shadow, but
    // the effect is on the pixels already in the target, not on a scene
    struct {
        uint32_t id;
        float blur;
    } backdrops[8];
    int backdropCount;
    // the frame's gradients (css.backgroundImage), by the id of the element that has one: the element's box is filled with
    // the linear gradient instead of its solid background. A table beside the commands, as the shadows are.
    struct {
        uint32_t id;
        int kind; // 1: linear
        float angle;
        int count;
        float offset[8];
        Clay_Color color[8];
        bool drawn;
    } gradients[16];
    int gradientCount;
    bool cut; // this frame's one cut has happened (the first backdrop's first rectangle)
    // the software canvas's target, for the CPU blur of a backdrop: the WebGPU canvas reads its frame back only after
    // the whole draw, so it sets none and a backdrop is not blurred there (the frame is not cut either)
    uint32_t *target;
    int targetWidth, targetHeight;
} Clay_ThorVGRendererData;

// CSS sizes a box-shadow's blur as twice the gaussian's standard deviation; ThorVG takes sigma, in the scene's own
// units (measured: the same sigma through a root scene at scale 2 blurs twice as many device pixels)
#define CLAY_THORVG_SHADOW_SIGMA(blur) ((blur) / 2.0f)
// the effect's steps: 80 is smooth at a 24px edge and costs one pass a shadow
#define CLAY_THORVG_SHADOW_QUALITY 80

// Clay sizes are CSS pixels; ThorVG sizes text in points at 96 dpi
#define CLAY_THORVG_PT 0.75f

static const char *Clay_ThorVG_CString(Clay_StringSlice s)
{
    // ponytail: one static buffer, text longer than it is cut; grow it when a page needs longer runs
    static char buf[1024];
    const int n = s.length < (int)sizeof buf - 1 ? s.length : (int)sizeof buf - 1;
    memcpy(buf, s.chars, n);
    buf[n] = 0;
    return buf;
}

static Clay_Dimensions Clay_ThorVG_MeasureText(Clay_StringSlice text, Clay_TextElementConfig *config, void *user)
{
    Clay_ThorVGRendererData *d = user;
    Tvg_Paint t = d->measurer;
    tvg_text_set_font(t, d->fonts[config->fontId]);
    tvg_text_set_size(t, (config->fontSize ? config->fontSize : 14) * CLAY_THORVG_PT);
    float w = 0;
    for (const char *p = Clay_ThorVG_CString(text); *p;) {
        Tvg_Glyph_Metrics g;
        if (tvg_text_get_glyph_metrics(t, p, &g, &p) != TVG_RESULT_SUCCESS) break;
        w += g.advance + config->letterSpacing;
    }
    Tvg_Text_Metrics m = {0};
    tvg_text_get_text_metrics(t, &m);
    return (Clay_Dimensions){w, config->lineHeight ? (float)config->lineHeight : m.advance};
}

/** Appends a rounded rect with elliptic corners: rx/ry per corner (tl, tr, br, bl), clamped to half the box. */
static void Clay_ThorVG_RoundRect(Tvg_Paint s, float x, float y, float w, float h, const float rx[4], const float ry[4])
{
    const float k = 1 - 0.5522848f, mx = w / 2, my = h / 2;
    float a[4], b[4];
    for (int i = 0; i < 4; i++) a[i] = rx[i] < mx ? rx[i] : mx, b[i] = ry[i] < my ? ry[i] : my;
    for (int i = 0; i < 4; i++) a[i] = a[i] > 0 ? a[i] : 0, b[i] = b[i] > 0 ? b[i] : 0;
    tvg_shape_move_to(s, x + a[0], y);
    tvg_shape_line_to(s, x + w - a[1], y);
    tvg_shape_cubic_to(s, x + w - a[1] * k, y, x + w, y + b[1] * k, x + w, y + b[1]);
    tvg_shape_line_to(s, x + w, y + h - b[2]);
    tvg_shape_cubic_to(s, x + w, y + h - b[2] * k, x + w - a[2] * k, y + h, x + w - a[2], y + h);
    tvg_shape_line_to(s, x + a[3], y + h);
    tvg_shape_cubic_to(s, x + a[3] * k, y + h, x, y + h - b[3] * k, x, y + h - b[3]);
    tvg_shape_line_to(s, x, y + b[0]);
    tvg_shape_cubic_to(s, x, y + b[0] * k, x + a[0] * k, y, x + a[0], y);
    tvg_shape_close(s);
}

/** The picture of an image path, loaded on first use and kept: the path is the imageData of the command, and the
 *  style's own string is the key, so two elements of one style share one picture. NULL if the file does not load. */
static Tvg_Paint Clay_ThorVG_Picture(Clay_ThorVGRendererData *d, const void *imageData)
{
    const char *path = imageData;
    if (!path) return NULL;
    for (int i = 0; i < d->imageCount; i++)
        if (d->images[i].imageData == imageData) return d->images[i].picture;
    // ponytail: 32 images, no eviction; a scene past that needs a list that grows
    if (d->imageCount == (int)(sizeof d->images / sizeof *d->images)) return NULL;
    Tvg_Paint p = tvg_picture_new();
    if (tvg_picture_load(p, path) != TVG_RESULT_SUCCESS) {
        fprintf(stderr, "image not loaded: %s\n", path);
        tvg_paint_rel(p);
        p = NULL;
    }
    d->images[d->imageCount].imageData = imageData;
    d->images[d->imageCount++].picture = p;
    return p;
}

/** Gives the element with this id's hash a shadow for the next draw (one a frame). It is a renderer effect, not a Clay
 *  declaration: `css.shadow` is carried beside the packed box, and the command stream's id is what finds it again. */
static void Clay_ThorVG_SetShadow(Clay_ThorVGRendererData *d, uint32_t id, float x, float y, float blur, Clay_Color color)
{
    // ponytail: 32 shadows a frame, one an element, no spread and no inner shadow (the box is the element's own); more
    // needs a table that grows and a second kind of shape
    if (d->shadowCount == (int)(sizeof d->shadows / sizeof *d->shadows)) return;
    d->shadows[d->shadowCount].id = id;
    d->shadows[d->shadowCount].x = x;
    d->shadows[d->shadowCount].y = y;
    d->shadows[d->shadowCount].blur = blur;
    d->shadows[d->shadowCount].color = color;
    d->shadows[d->shadowCount].drawn = false;
    d->shadowCount++;
}

/** Draws the shadow of the element a command belongs to, once and before the command itself: the command's box moved by
 *  the shadow's offset, filled with its colour, blurred as a scene effect. A rectangle or a border brings its corner
 *  radii; a text or an image box is square. */
static void Clay_ThorVG_DrawShadow(Clay_ThorVGRendererData *d, Clay_RenderCommand *rcmd, Tvg_Paint into)
{
    for (int i = 0; i < d->shadowCount; i++) {
        if (d->shadows[i].id != rcmd->id || d->shadows[i].drawn) continue;
        d->shadows[i].drawn = true;
        const float blur = d->shadows[i].blur;
        const float x = (int)rcmd->boundingBox.x + d->shadows[i].x;
        const float y = (int)rcmd->boundingBox.y + d->shadows[i].y;
        const float w = (int)rcmd->boundingBox.width, h = (int)rcmd->boundingBox.height;
        float rad[4] = {0, 0, 0, 0};
        if (rcmd->commandType == CLAY_RENDER_COMMAND_TYPE_RECTANGLE ||
            rcmd->commandType == CLAY_RENDER_COMMAND_TYPE_BORDER) {
            const Clay_CornerRadius c = rcmd->commandType == CLAY_RENDER_COMMAND_TYPE_RECTANGLE
                                            ? rcmd->renderData.rectangle.cornerRadius
                                            : rcmd->renderData.border.cornerRadius;
            rad[0] = c.topLeft, rad[1] = c.topRight, rad[2] = c.bottomRight, rad[3] = c.bottomLeft;
        }
        const Clay_Color fill = d->shadows[i].color;
        Tvg_Paint scene = tvg_scene_new();
        Tvg_Paint shape = tvg_shape_new();
        Clay_ThorVG_RoundRect(shape, x, y, w, h, rad, rad);
        tvg_shape_set_fill_color(shape, fill.r, fill.g, fill.b, fill.a);
        tvg_scene_add(scene, shape);
        // sigma is in the scene's own units, like the shape's coordinates: the root scene's scale applies to it too
        if (blur > 0)
            tvg_scene_add_effect_gaussian_blur(scene, CLAY_THORVG_SHADOW_SIGMA(blur), 0, 0,
                                               CLAY_THORVG_SHADOW_QUALITY);
        tvg_scene_add(into, scene);
    }
}

/** Gives the element with this id's hash a backdrop for the next draw (one a frame): the pixels under its box, blurred
 *  by blur before its own commands. A renderer effect, as the shadow. */
static void Clay_ThorVG_SetBackdrop(Clay_ThorVGRendererData *d, uint32_t id, float blur)
{
    // ponytail: 8 backdrops a frame (one cut is what is drawn, see the render), no list that grows
    if (d->backdropCount == (int)(sizeof d->backdrops / sizeof *d->backdrops)) return;
    d->backdrops[d->backdropCount].id = id;
    d->backdrops[d->backdropCount].blur = blur;
    d->backdropCount++;
}

/** The blur of the element with this id, or -1 when it has no backdrop. */
static float Clay_ThorVG_BackdropOf(Clay_ThorVGRendererData *d, uint32_t id)
{
    for (int i = 0; i < d->backdropCount; i++)
        if (d->backdrops[i].id == id) return d->backdrops[i].blur;
    return -1;
}

/** Gives the element with this id's hash a background image for the next draw (one a frame): a linear gradient that fills
 *  the element's box instead of its solid background. `stops` is `count` rows of (offset 0..1, r, g, b, a). A renderer
 *  effect, as the shadow: no Clay field holds one, and the command stream's id is what finds it again. */
static void Clay_ThorVG_SetBackgroundImage(Clay_ThorVGRendererData *d, uint32_t id, int kind, float angle, int count,
                                           const float stops[][5])
{
    // ponytail: 16 gradients a frame, 8 stops each, one an element; more needs a table that grows
    if (d->gradientCount == (int)(sizeof d->gradients / sizeof *d->gradients)) return;
    if (count < 2) return;
    if (count > 8) count = 8;
    int i = d->gradientCount++;
    d->gradients[i].id = id;
    d->gradients[i].kind = kind;
    d->gradients[i].angle = angle;
    d->gradients[i].count = count;
    for (int k = 0; k < count; k++) {
        d->gradients[i].offset[k] = stops[k][0];
        d->gradients[i].color[k] = (Clay_Color){stops[k][1], stops[k][2], stops[k][3], stops[k][4]};
    }
    d->gradients[i].drawn = false;
}

/** The gradient of the element with this id, at its `*at`, if it has one it has not drawn yet; false when it has none. */
static bool Clay_ThorVG_GradientOf(Clay_ThorVGRendererData *d, uint32_t id, int *at)
{
    for (int i = 0; i < d->gradientCount; i++)
        if (d->gradients[i].id == id && !d->gradients[i].drawn) return (*at = i), true;
    return false;
}

#define CLAY_THORVG_PI 3.14159265358979323846f

/** Fills a shape with a linear gradient along CSS's gradient line: the direction (sin θ, -cos θ) (0deg is up, 90 right),
 *  the line's length |w·sinθ| + |h·cosθ| (the box's projection on it), from the box's centre out to both ends. The
 *  coordinates are the shape's own, the same space as its path: the root scene carries the pixel density, as for a
 *  shadow's sigma. */
static void Clay_ThorVG_FillGradient(Tvg_Paint s, const float angle, int count, const float *offset,
                                     const Clay_Color *color, float x, float y, float w, float h)
{
    const float rad = angle * CLAY_THORVG_PI / 180.0f;
    const float dx = sinf(rad), dy = -cosf(rad);
    const float len = fabsf(w * dx) + fabsf(h * dy);
    const float cx = x + w / 2, cy = y + h / 2;
    Tvg_Color_Stop stops[8];
    for (int i = 0; i < count; i++)
        stops[i] = (Tvg_Color_Stop){offset[i], (uint8_t)color[i].r, (uint8_t)color[i].g, (uint8_t)color[i].b,
                                    (uint8_t)color[i].a};
    Tvg_Gradient grad = tvg_linear_gradient_new();
    tvg_linear_gradient_set(grad, cx - dx * len / 2, cy - dy * len / 2, cx + dx * len / 2, cy + dy * len / 2);
    tvg_gradient_set_color_stops(grad, stops, (uint32_t)count);
    // the shape takes the gradient: setting the fill hands it over, so there is no tvg_gradient_del of ours
    tvg_shape_set_gradient(s, grad);
}

// The backdrop blur's machine: a separable box blur, three passes each way, which is a gaussian to the eye and has no
// kernel to build. A pass of radius r three times has the variance (r^2 + r) of a gaussian, so CSS's blur radius (sigma
// = blur / 2, the shadow's reading) picks r = (sqrt(1 + 4 sigma^2) - 1) / 2.
#define CLAY_THORVG_BACKDROP_PASSES 3

/** A box blur of one row, radius r, the window clamped to the row's ends (the box's own edge is not pulled in from
 *  outside it). Alpha is copied through: the target's is 255 everywhere.
 *  Three sums and a division a pixel; n is the same for the whole blur, so the division is a multiply the compiler
 *  hoists (measured: 0.11 ms a pass each way for a 150x133 box at any radius up to 16, the traffic being the cost).
 *  ponytail: three integer sums a pixel, no SIMD, no half-resolution pass; the region is what keeps it small. */
static void Clay_ThorVG_BoxBlurH(const uint8_t *src, uint8_t *dst, int w, int h, int r)
{
    const int n = 2 * r + 1;
    for (int y = 0; y < h; y++) {
        const uint8_t *s = src + (size_t)y * w * 4;
        uint8_t *o = dst + (size_t)y * w * 4;
        int sr = 0, sg = 0, sb = 0;
        for (int i = -r; i <= r; i++) {
            const int x = i < 0 ? 0 : (i >= w ? w - 1 : i);
            sr += s[x * 4], sg += s[x * 4 + 1], sb += s[x * 4 + 2];
        }
        for (int x = 0; x < w; x++) {
            o[x * 4] = (uint8_t)(sr / n), o[x * 4 + 1] = (uint8_t)(sg / n), o[x * 4 + 2] = (uint8_t)(sb / n);
            o[x * 4 + 3] = s[x * 4 + 3];
            const int out = x - r < 0 ? 0 : x - r, in = x + r + 1 >= w ? w - 1 : x + r + 1;
            sr += s[in * 4] - s[out * 4], sg += s[in * 4 + 1] - s[out * 4 + 1], sb += s[in * 4 + 2] - s[out * 4 + 2];
        }
    }
}

/** The same for one column. */
static void Clay_ThorVG_BoxBlurV(const uint8_t *src, uint8_t *dst, int w, int h, int r)
{
    const int n = 2 * r + 1;
    const size_t stride = (size_t)w * 4;
    for (int x = 0; x < w; x++) {
        const uint8_t *s = src + (size_t)x * 4;
        uint8_t *o = dst + (size_t)x * 4;
        int sr = 0, sg = 0, sb = 0;
        for (int i = -r; i <= r; i++) {
            const uint8_t *p = s + (size_t)(i < 0 ? 0 : (i >= h ? h - 1 : i)) * stride;
            sr += p[0], sg += p[1], sb += p[2];
        }
        for (int y = 0; y < h; y++) {
            uint8_t *q = o + (size_t)y * stride;
            q[0] = (uint8_t)(sr / n), q[1] = (uint8_t)(sg / n), q[2] = (uint8_t)(sb / n), q[3] = s[y * stride + 3];
            const int out = y - r < 0 ? 0 : y - r, in = y + r + 1 >= h ? h - 1 : y + r + 1;
            sr += s[in * stride] - s[out * stride], sg += s[in * stride + 1] - s[out * stride + 1],
                sb += s[in * stride + 2] - s[out * stride + 2];
        }
    }
}

/** Blurs the box of a backdrop's first command in the target, and only it: the box clipped to the canvas, two buffers of
 *  the region, three passes. Nothing outside the box is read or written, so the frame around it is untouched. */
static void Clay_ThorVG_BlurBackdrop(Clay_ThorVGRendererData *d, Clay_RenderCommand *rcmd, float blur)
{
    uint32_t *px = d->target;
    if (!px || blur <= 0) return;
    const int tw = d->targetWidth, th = d->targetHeight;
    int x0 = (int)floorf(rcmd->boundingBox.x * d->scale), y0 = (int)floorf(rcmd->boundingBox.y * d->scale);
    int x1 = (int)ceilf((rcmd->boundingBox.x + rcmd->boundingBox.width) * d->scale);
    int y1 = (int)ceilf((rcmd->boundingBox.y + rcmd->boundingBox.height) * d->scale);
    if (x0 < 0) x0 = 0;
    if (y0 < 0) y0 = 0;
    if (x1 > tw) x1 = tw;
    if (y1 > th) y1 = th;
    const int w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    // sigma in device pixels, and the box radius of one of the three passes
    const float sigma = blur * d->scale / 2.0f;
    int r = (int)lroundf((sqrtf(1 + 4 * sigma * sigma) - 1) / 2);
    if (r < 1) r = 1;
    // ponytail: two buffers of the box, malloc'd a blur; a page that blurs every frame could keep them (and would need
    // the largest box it has seen)
    const size_t bytes = (size_t)w * h * 4;
    uint8_t *a = malloc(bytes), *b = malloc(bytes);
    if (!a || !b) {
        free(a), free(b);
        return;
    }
    for (int y = 0; y < h; y++) memcpy(a + (size_t)y * w * 4, px + (size_t)(y0 + y) * tw + x0, (size_t)w * 4);
    for (int pass = 0; pass < CLAY_THORVG_BACKDROP_PASSES; pass++) {
        Clay_ThorVG_BoxBlurH(a, b, w, h, r);
        Clay_ThorVG_BoxBlurV(b, a, w, h, r);
    }
    for (int y = 0; y < h; y++) memcpy(px + (size_t)(y0 + y) * tw + x0, a + (size_t)y * w * 4, (size_t)w * 4);
    free(a), free(b);
}

/** Rebuilds the canvas from the commands and draws it into the target buffer, over what the buffer holds (or, with
 *  d->clear, clearing it first); false if the canvas could not sync its target. */
static bool Clay_ThorVG_RenderClayCommands(Clay_ThorVGRendererData *d, Clay_RenderCommandArray *rcommands)
{
    tvg_canvas_remove(d->canvas, NULL);
    Tvg_Paint root = tvg_scene_new(), into = root;
    tvg_paint_scale(root, d->scale);
    d->cut = false;
    for (int32_t i = 0; i < rcommands->length; i++) {
        Clay_RenderCommand *rcmd = Clay_RenderCommandArray_Get(rcommands, i);
        // a shadow of this element (css.shadow) goes before its first command, in the same scene as the command
        Clay_ThorVG_DrawShadow(d, rcmd, into);
        // whole pixels, as Clay's SDL3 renderer
        const float x = (int)rcmd->boundingBox.x, y = (int)rcmd->boundingBox.y;
        const float w = (int)rcmd->boundingBox.width, h = (int)rcmd->boundingBox.height;
        // a backdrop (css.backdrop): everything under the element has been drawn (its shadow too, which lies on the
        // unblurred page), so draw this pass, blur the element's box in the buffer, and carry on in a new scene over the
        // blurred pixels. The element's own commands — its fill, its text, its border — land in that second pass and stay
        // crisp. One cut a frame: glass under glass would need the first panel's pixels, and a second cut would read a
        // frame the first one has already drawn.
        // ponytail: only a rectangle cuts, and only outside a scissor scene; a backdrop inside a clip is not blurred, and
        // neither is one on the WebGPU canvas (it has no target to read before the whole frame is drawn).
        if (d->target && !d->cut && into == root && rcmd->commandType == CLAY_RENDER_COMMAND_TYPE_RECTANGLE &&
            Clay_ThorVG_BackdropOf(d, rcmd->id) >= 0) {
            d->cut = true;
            tvg_canvas_add(d->canvas, root);
            tvg_canvas_draw(d->canvas, d->clear);
            if (tvg_canvas_sync(d->canvas) != TVG_RESULT_SUCCESS) return false;
            // taken off the canvas so the second draw does not overdraw the blur with it; ThorVG's canvas owns it from
            // add to remove, so there is no reference of ours to release (tvg_paint_rel here is a double free)
            tvg_canvas_remove(d->canvas, root);
            Clay_ThorVG_BlurBackdrop(d, rcmd, Clay_ThorVG_BackdropOf(d, rcmd->id));
            root = tvg_scene_new(), into = root;
            tvg_paint_scale(root, d->scale);
            // ThorVG's software canvas seeds its working surface from the target on its first draw and replaces what a
            // later draw's paints touch: setting the same target again is what lets this pass composite the panel over
            // the blurred pixels (measured: without it a translucent fill comes out as its own alpha, and a scene
            // effect drawn in the pass before wipes the frame). A WebGPU canvas has no target here, and no cut.
            if (d->target)
                tvg_swcanvas_set_target(d->canvas, d->target, d->targetWidth, d->targetWidth, d->targetHeight,
                                        TVG_COLORSPACE_ABGR8888);
        }
        switch (rcmd->commandType) {
        case CLAY_RENDER_COMMAND_TYPE_RECTANGLE: {
            const Clay_RectangleRenderData *r = &rcmd->renderData.rectangle;
            const Clay_CornerRadius c = r->cornerRadius;
            const float rad[4] = {c.topLeft, c.topRight, c.bottomRight, c.bottomLeft};
            Tvg_Paint s = tvg_shape_new();
            Clay_ThorVG_RoundRect(s, x, y, w, h, rad, rad);
            // a gradient (css.backgroundImage) fills the element's box instead of its solid colour: the first rectangle
            // command of the element takes it, drawn over the shadow and (after a backdrop's cut) over the blurred page
            int gradient;
            if (Clay_ThorVG_GradientOf(d, rcmd->id, &gradient)) {
                d->gradients[gradient].drawn = true;
                // ponytail: the solid background under a gradient is not drawn at all, not blended with it
                Clay_ThorVG_FillGradient(s, d->gradients[gradient].angle, d->gradients[gradient].count,
                                         d->gradients[gradient].offset, d->gradients[gradient].color, x, y, w, h);
            } else
                tvg_shape_set_fill_color(s, r->backgroundColor.r, r->backgroundColor.g, r->backgroundColor.b,
                                         r->backgroundColor.a);
            tvg_scene_add(into, s);
        } break;
        case CLAY_RENDER_COMMAND_TYPE_BORDER: {
            // inside the box: the outer edge is the box with its radii, the inner edge is inset by each side's
            // width, its corners the outer radii less the widths that meet there; the ring between is filled
            const Clay_BorderRenderData *r = &rcmd->renderData.border;
            const Clay_CornerRadius c = r->cornerRadius;
            const Clay_BorderWidth bw = r->width;
            const float rad[4] = {c.topLeft, c.topRight, c.bottomRight, c.bottomLeft};
            const float irx[4] = {c.topLeft - bw.left, c.topRight - bw.right, c.bottomRight - bw.right,
                                  c.bottomLeft - bw.left};
            const float iry[4] = {c.topLeft - bw.top, c.topRight - bw.top, c.bottomRight - bw.bottom,
                                  c.bottomLeft - bw.bottom};
            Tvg_Paint s = tvg_shape_new();
            Clay_ThorVG_RoundRect(s, x, y, w, h, rad, rad);
            const float iw = w - bw.left - bw.right, ih = h - bw.top - bw.bottom;
            if (iw > 0 && ih > 0) Clay_ThorVG_RoundRect(s, x + bw.left, y + bw.top, iw, ih, irx, iry);
            tvg_shape_set_fill_rule(s, TVG_FILL_RULE_EVEN_ODD);
            tvg_shape_set_fill_color(s, r->color.r, r->color.g, r->color.b, r->color.a);
            tvg_scene_add(into, s);
        } break;
        case CLAY_RENDER_COMMAND_TYPE_TEXT: {
            const Clay_TextRenderData *r = &rcmd->renderData.text;
            Tvg_Paint t = tvg_text_new();
            tvg_text_set_font(t, d->fonts[r->fontId]);
            tvg_text_set_size(t, r->fontSize * CLAY_THORVG_PT);
            tvg_text_set_text(t, Clay_ThorVG_CString(r->stringContents));
            tvg_text_set_color(t, r->textColor.r, r->textColor.g, r->textColor.b);
            tvg_paint_set_opacity(t, r->textColor.a);
            tvg_paint_translate(t, x, y);
            tvg_scene_add(into, t);
        } break;
        case CLAY_RENDER_COMMAND_TYPE_SCISSOR_START: {
            // ponytail: one level, as Clay's SDL3 renderer (SCISSOR_END goes back to no clip); a stack of scenes
            // when nested scroll containers need it
            Tvg_Paint clip = tvg_shape_new();
            tvg_shape_append_rect(clip, x, y, w, h, 0, 0, true);
            into = tvg_scene_new();
            tvg_paint_set_clip(into, clip);
            tvg_scene_add(root, into);
        } break;
        case CLAY_RENDER_COMMAND_TYPE_SCISSOR_END: into = root; break;
        case CLAY_RENDER_COMMAND_TYPE_IMAGE: {
            // imageData is the path of the picture (Clay's image config is that pointer alone), loaded once per path;
            // the command's box is where it goes, and ThorVG scales the picture into it
            Tvg_Paint picture = Clay_ThorVG_Picture(d, rcmd->renderData.image.imageData);
            if (!picture) break;
            Tvg_Paint p = tvg_paint_duplicate(picture);
            tvg_picture_set_size(p, w, h);
            tvg_paint_translate(p, x, y);
            tvg_scene_add(into, p);
        } break;
        default: SDL_Log("Unknown render command type: %d", rcmd->commandType);
        }
    }
    tvg_canvas_add(d->canvas, root);
    // the second pass overdraws the first: it must not clear what the blur left there
    tvg_canvas_draw(d->canvas, d->cut ? false : d->clear);
    return tvg_canvas_sync(d->canvas) == TVG_RESULT_SUCCESS;
}
