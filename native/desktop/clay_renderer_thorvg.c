// Clay's render commands on ThorVG's software canvas: each frame is a new scene of shapes and texts, drawn into a
// 32-bit buffer (ABGR8888: R,G,B,A bytes in memory, as SDL's RGBA32). Text is measured with ThorVG too, so what Clay
// lays out is what is drawn: the width is the sum of glyph advances (ThorVG 1.1 applies no kerning), the height the
// font's line advance.
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

/** Rebuilds the canvas from the commands and draws it into the target buffer, over what the buffer holds (or, with
 *  d->clear, clearing it first); false if the canvas could not sync its target. */
static bool Clay_ThorVG_RenderClayCommands(Clay_ThorVGRendererData *d, Clay_RenderCommandArray *rcommands)
{
    tvg_canvas_remove(d->canvas, NULL);
    Tvg_Paint root = tvg_scene_new(), into = root;
    tvg_paint_scale(root, d->scale);
    for (int32_t i = 0; i < rcommands->length; i++) {
        Clay_RenderCommand *rcmd = Clay_RenderCommandArray_Get(rcommands, i);
        // a shadow of this element (css.shadow) goes before its first command, in the same scene as the command
        Clay_ThorVG_DrawShadow(d, rcmd, into);
        // whole pixels, as Clay's SDL3 renderer
        const float x = (int)rcmd->boundingBox.x, y = (int)rcmd->boundingBox.y;
        const float w = (int)rcmd->boundingBox.width, h = (int)rcmd->boundingBox.height;
        switch (rcmd->commandType) {
        case CLAY_RENDER_COMMAND_TYPE_RECTANGLE: {
            const Clay_RectangleRenderData *r = &rcmd->renderData.rectangle;
            const Clay_CornerRadius c = r->cornerRadius;
            const float rad[4] = {c.topLeft, c.topRight, c.bottomRight, c.bottomLeft};
            Tvg_Paint s = tvg_shape_new();
            Clay_ThorVG_RoundRect(s, x, y, w, h, rad, rad);
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
    tvg_canvas_draw(d->canvas, d->clear);
    return tvg_canvas_sync(d->canvas) == TVG_RESULT_SUCCESS;
}
