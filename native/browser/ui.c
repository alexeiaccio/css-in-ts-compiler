// The Solid page's half of the browser target: the same flat `ui_*` surface solid/native/ui.c gives bun:ffi, over Clay
// and nothing else — no SDL, no window, no ThorVG. The page (browser/solid/) is the desktop's own modules (src/frame.ts,
// src/renderer.ts, app/Sensors.tsx) compiled by Bun for the browser; they call these functions through
// browser/solid/ffi-browser.ts, and the raster is Canvas2D over the command array (browser/draw.js), as the no-JS page's
// is (browser/page.c).
//
// Kept from the desktop's ui.c: the packed style floats (45 fields), the text's 10, the value channel, the text arena,
// Clay's own scroll containers (`ui_scroll_*`), the pointer over an id, the frame hash, the dump through
// desktop/clay_dump.c and the page's id strings behind Clay's hashes.
// Dropped, because each was the desktop's renderer or its window:
//   - ThorVG: ui_shadow, ui_backdrop, ui_backgroundImage and the group/scene table (fields 45-50 and 55 of the value
//     channel) — Canvas2D here draws the command array alone, so those effects have no target;
//   - images: ui_image (a path is not a decoded bitmap in the page);
//   - the window: ui_window_*, SDL's key/text queues, the clipboard, PNG load/save/diff, `ui_pixel`/`ui_pixels_copy`
//     (the pixels are the page's canvas: ffi-browser reads them with getImageData);
//   - `ui_density` (the canvas's devicePixelRatio is the page's), `ui_font` (the page loads Roboto as a FontFace and
//     Canvas2D measures with it; a font id is the style's), `ui_init_gpu`, `ui_presents`.
//
// ABI, all 32-bit little endian in the linear memory (browser/solid/ffi-browser.ts allocates):
//   ui_init(w, h)              Clay's arena and the layout's size; once
//   ui_begin(px, py, down, dt)  the pointer, then Clay's layout opens
//   ui_open(id, len, style)    45 floats; ui_text(id, len, bytes, len, style) 10 floats; ui_close()
//   ui_end(dt)                 layout: the command count
//   ui_value(id, len, field, v) the frame's overrides, before the tree
//   cmd_count(), cmd_size(), cmds(), measure_slot()   the commands of the last frame, for JS to draw
//   ui_hash()                  the frame's hash, so a host skips the draw of an unchanged frame
//   dump(), dump_ptr()         the last frame as clay_dump.c's JSON, as browser/page.c has it
//   malloc(n), free(p)         for JS: the strings, ids and float arrays it passes in
#define CLAY_IMPLEMENTATION
#include "clay.h"

#include <math.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "../desktop/clay_dump.c" // the one emitter every host dumps through

#define EXPORT(name) __attribute__((export_name(name)))

// a style is a compile-time literal (solid/plugin.ts packs it once); only the value channel moves its numbers
#define STYLE_FIELDS 45
#define TEXT_FIELDS 10
#define FIELD_SHADOW_BLUR 45 // the desktop's renderer tables: parsed and ignored here (a shadow has no target)
#define FIELD_ALPHA 46
#define FIELD_SCALE 47
#define FIELD_TRANSLATE_X 48
#define FIELD_TRANSLATE_Y 49
#define FIELD_GRADIENT_ALPHA 50
#define FIELD_TEXT_COLOR_R 51
#define FIELD_TEXT_COLOR_A 54
#define FIELD_ROTATE 55

// the page's text lives here for the frame: Clay keeps the pointer until the render pass (the desktop's sizes)
#define ARENA_SIZE (1 << 16)
// ponytail: 64 overrides a frame, as the desktop's; more needs a bigger table
#define MAX_VALUES 64
// ponytail: 512 names a process, as the desktop's; later ids are unnamed in a dump
#define MAX_ID_NAMES 512
// ponytail: 512 elements a frame (a command of one carries its node for the dump's text alignment)
#define MAX_NODES 512
// browser/page.c's 64 is the generated page's; a Solid page's tree is bigger (the Widgets page's is 55 commands)
#define MAX_COMMANDS 1024

// browser/page.c's WebCommand, unchanged, so draw.js's readCommands reads both wasms the same way
typedef struct {
    int32_t type, id;
    float x, y, w, h;
    uint32_t color;
    float radius[4];
    float border[4];
    uint32_t text, textLength;
    int32_t fontId, fontSize;
} WebCommand;

static WebCommand commands[MAX_COMMANDS];
static int32_t command_count;
static char arena[ARENA_SIZE];
static int arena_used;
static int width, height, errors;
static Clay_RenderCommandArray cmds;
static uint64_t frame_hash = 0xcbf29ce484222325ull;
static int draw_count;

// the value channel: this frame's overrides of a packed style, by element id
static struct {
    uint32_t id;
    uint16_t field;
    float value;
} values[MAX_VALUES];
static int value_count;

// the page's id strings, by Clay's hash: a dump names a command's element from it
static ClayDumpName id_names[MAX_ID_NAMES];
static int id_name_count;
// each node's text alignment and wrap, by node: Clay's text command carries neither (the dump reads them)
static unsigned char text_align[MAX_NODES], text_wrap[MAX_NODES];
static int node_count;

// the wheel this module took, in Clay's units (positive scrolls the content down, as SDL's wheel y)
static float wheel_x, wheel_y, page_wheel_x, page_wheel_y;
static int auto_scroll = 1;

static float measure_slot[2];
// the measure callback's answer goes through this: Canvas2D, in browser/solid/ffi-browser.ts
extern void measure_text(const char *chars, int length, int fontId, int fontSize)
    __attribute__((import_module("env"), import_name("measure")));

static void on_error(Clay_ErrorData e)
{
    (void)e;
    errors++;
}

static Clay_Dimensions measure(Clay_StringSlice text, Clay_TextElementConfig *config, void *user)
{
    (void)user;
    const int size = config->fontSize ? config->fontSize : 14;
    measure_text(text.chars, text.length, config->fontId, size);
    return (Clay_Dimensions){measure_slot[0], config->lineHeight ? (float)config->lineHeight : measure_slot[1]};
}

EXPORT("measure_slot") float *page_measure_slot(void) { return measure_slot; }

static Clay_String slice(const char *s, int len) { return (Clay_String){.length = len, .chars = s}; }

/** Colours arrive as 0-255 floats; one int32 is r<<16 | g<<8 | b | a<<24 for JS's "#rrggbb" (browser/page.c's rule). */
static uint32_t channel(float v) { return v <= 0 ? 0 : v >= 255 ? 255 : (uint32_t)(v + 0.5f); }
static uint32_t pack(Clay_Color c)
{
    return channel(c.r) << 16 | channel(c.g) << 8 | channel(c.b) | channel(c.a) << 24;
}

EXPORT("ui_init") int32_t ui_init(int32_t w, int32_t h)
{
    width = w, height = h;
    const uint32_t needed = Clay_MinMemorySize();
    char *memory = malloc(needed);
    if (!memory) {
        errors++;
        return 1;
    }
    Clay_Initialize(Clay_CreateArenaWithCapacityAndMemory(needed, memory), (Clay_Dimensions){(float)w, (float)h},
                    (Clay_ErrorHandler){on_error, 0});
    Clay_SetMeasureTextFunction(measure, 0);
    return 0;
}

/** A font file is the page's (a FontFace, measured by Canvas2D): a style's font id is what it is. 0, as the first id. */
EXPORT("ui_font") int32_t ui_font(const char *path)
{
    (void)path;
    return 0;
}

EXPORT("ui_errors") int32_t ui_errors(void) { return errors; }

/** Adds a wheel delta to the next frame, in Clay's units: positive scrolls the content down. */
EXPORT("ui_wheel") void ui_wheel(float dx, float dy)
{
    wheel_x += dx, wheel_y += dy;
    page_wheel_x += dx, page_wheel_y += dy;
}

/** The wheel since the last pop into out[2], drained; 0 when there is none. */
EXPORT("ui_wheel_pop") int32_t ui_wheel_pop(float *out)
{
    if (page_wheel_x == 0 && page_wheel_y == 0) return 0;
    out[0] = page_wheel_x, out[1] = page_wheel_y;
    page_wheel_x = page_wheel_y = 0;
    return 1;
}

/** Turns Clay's own wheel scrolling on (1, the default) or off (0): a page that scrolls itself owns the offset. */
EXPORT("ui_auto_scroll") void ui_auto_scroll(int32_t on) { auto_scroll = on != 0; }

/** Pointer position and button for this frame, then Clay opens the layout. */
EXPORT("ui_begin") void ui_begin(float px, float py, int32_t down, float dt)
{
    arena_used = 0;
    value_count = 0;
    node_count = 0;
    Clay_SetPointerState((Clay_Vector2){px, py}, down);
    if (auto_scroll) Clay_UpdateScrollContainers(0, (Clay_Vector2){wheel_x, wheel_y}, dt);
    wheel_x = 0, wheel_y = 0;
    Clay_BeginLayout();
}

/** True when the pointer is over the element of that id in the layout of the last frame. */
EXPORT("ui_pointer_over") int32_t ui_pointer_over(const char *id, int32_t len)
{
    return Clay_PointerOver(Clay__HashString(slice(id, len), 0));
}

static Clay_SizingAxis axis(const float *f)
{
    Clay_SizingAxis a = {0};
    a.type = (Clay__SizingType)f[0]; // 0 FIT, 1 GROW, 2 PERCENT, 3 FIXED: Clay's own order
    if (a.type == CLAY__SIZING_TYPE_PERCENT) a.size.percent = f[1];
    else a.size.minMax.min = f[1], a.size.minMax.max = f[2];
    return a;
}

static Clay_Color color(const float *f) { return (Clay_Color){f[0], f[1], f[2], f[3]}; }

// the page's id string of an element, kept by Clay's hash of it
static void intern_id(uint32_t id, const char *s, int len)
{
    if (!s || len <= 0) return;
    for (int i = 0; i < id_name_count; i++)
        if (id_names[i].id == id) return;
    if (id_name_count == MAX_ID_NAMES) return;
    id_names[id_name_count].id = id;
    id_names[id_name_count].name = strndup(s, (size_t)len);
    id_name_count++;
}

/** An override of one number of the style of the element with that id, for this frame only: fields 0..44 are the packed
 *  fields, 51..54 the colour of the text with that id. The desktop's renderer fields (45 shadow blur, 46 alpha, 47
 *  scale, 48/49 translate, 50 gradient alpha, 55 rotate) are accepted and ignored: they shifted a ThorVG scene, and a
 *  Canvas2D command array has no scene. */
EXPORT("ui_value") void ui_value(const char *id, int32_t len, int32_t field, float value)
{
    if (field < 0 || field > FIELD_ROTATE || value_count == MAX_VALUES) {
        errors++;
        return;
    }
    values[value_count].id = Clay__HashString(slice(id, len), 0).id;
    values[value_count].field = (uint16_t)field;
    values[value_count].value = value;
    value_count++;
}

/** Opens an element. id is NULL for an anonymous one; f is 45 floats: the box fields, then the floating ones. */
EXPORT("ui_open") void ui_open(const char *id, int32_t len, const float *style)
{
    static const Clay_LayoutAlignmentX ax[3] = {CLAY_ALIGN_X_LEFT, CLAY_ALIGN_X_CENTER, CLAY_ALIGN_X_RIGHT};
    static const Clay_LayoutAlignmentY ay[3] = {CLAY_ALIGN_Y_TOP, CLAY_ALIGN_Y_CENTER, CLAY_ALIGN_Y_BOTTOM};
    Clay_ElementId eid = {0};
    if (id) eid = Clay__HashString(slice(id, len), 0);
    if (id) intern_id(eid.id, id, len);
    // the value channel: this element's overrides, applied to a copy of its own floats
    float over[STYLE_FIELDS];
    const float *f = style;
    if (id && value_count) {
        int mine = 0;
        for (int i = 0; i < value_count; i++) mine += values[i].id == eid.id;
        if (mine) {
            memcpy(over, style, sizeof over);
            for (int i = 0; i < value_count; i++) {
                if (values[i].id != eid.id) continue;
                // 46..50 and 55 are the desktop renderer's; 51..54 a text's, past these floats
                if (values[i].field < STYLE_FIELDS && values[i].field < FIELD_SHADOW_BLUR)
                    over[values[i].field] = values[i].value;
            }
            f = over;
        }
    }
    Clay_ElementDeclaration d = {0};
    d.layout.sizing.width = axis(f + 0);
    d.layout.sizing.height = axis(f + 3);
    d.layout.padding = (Clay_Padding){f[6], f[7], f[8], f[9]};
    d.layout.childGap = f[10];
    d.layout.childAlignment = (Clay_ChildAlignment){ax[(int)f[11]], ay[(int)f[12]]};
    d.layout.layoutDirection = f[13] ? CLAY_TOP_TO_BOTTOM : CLAY_LEFT_TO_RIGHT;
    d.backgroundColor = color(f + 14);
    d.cornerRadius = (Clay_CornerRadius){f[18], f[19], f[20], f[21]};
    d.border.width = (Clay_BorderWidth){f[22], f[23], f[24], f[25]};
    d.border.color = color(f + 26);
    d.clip.horizontal = f[30] != 0, d.clip.vertical = f[31] != 0;
    if (f[32] != 0) {
        d.floating.attachTo = (Clay_FloatingAttachToElement)(int)f[33];
        // the id arrives as two 16-bit halves: a float32 cannot hold the 32-bit hash exactly
        d.floating.parentId = ((uint32_t)f[34] << 16) | (uint32_t)f[35];
        d.floating.attachPoints = (Clay_FloatingAttachPoints){(Clay_FloatingAttachPointType)(int)f[36],
                                                              (Clay_FloatingAttachPointType)(int)f[37]};
        d.floating.offset = (Clay_Vector2){f[38], f[39]};
        d.floating.expand = (Clay_Dimensions){f[40], f[41]};
        d.floating.zIndex = (int16_t)f[42];
        d.floating.pointerCaptureMode = (Clay_PointerCaptureMode)(int)f[43];
        d.floating.clipTo = (Clay_FloatingClipToElement)(int)f[44];
    }
    if (id) Clay__OpenElementWithId(eid);
    else Clay__OpenElement();
    // the node index is what a command carries (userData) and what the dump reads a text's alignment by; an element
    // that is not a text leaves the two arrays' bytes for its node at Clay's zero
    if (node_count < MAX_NODES) d.userData = (void *)(uintptr_t)(++node_count);
    else errors++; // ponytail: MAX_NODES elements a frame; a deeper page needs a bigger table
    // a clip element is a scroll container: the offset Clay kept for it across frames is what shifts its children
    if (d.clip.horizontal || d.clip.vertical) d.clip.childOffset = Clay_GetScrollOffset();
    Clay__ConfigureOpenElement(d);
}

EXPORT("ui_close") void ui_close(void) { Clay__CloseElement(); }

/** A text element, with an id or NULL. A text's colour is its own four floats: with an id, fields 51..54 override the
 *  colour of its copy of the 10 (the value channel's second kind of target). The bytes are copied for the frame. */
EXPORT("ui_text") void ui_text(const char *id, int32_t id_len, const char *s, int32_t len, const float *f)
{
    static const Clay_TextAlignment al[3] = {CLAY_TEXT_ALIGN_LEFT, CLAY_TEXT_ALIGN_CENTER, CLAY_TEXT_ALIGN_RIGHT};
    static const Clay_TextElementConfigWrapMode wm[3] = {CLAY_TEXT_WRAP_WORDS, CLAY_TEXT_WRAP_NEWLINES,
                                                         CLAY_TEXT_WRAP_NONE};
    // ponytail: 64 KB of text a frame; a longer page needs a bigger arena
    if (len < 0 || arena_used + len > ARENA_SIZE) {
        errors++;
        return;
    }
    char *copy = arena + arena_used;
    memcpy(copy, s, (size_t)len);
    arena_used += len;
    Clay_ElementId eid = {0};
    float over[TEXT_FIELDS];
    const float *tf = f;
    if (id) {
        eid = Clay__HashString(slice(id, id_len), 0);
        intern_id(eid.id, id, id_len);
        int mine = 0;
        for (int i = 0; i < value_count; i++)
            mine += values[i].id == eid.id && values[i].field >= FIELD_TEXT_COLOR_R &&
                    values[i].field <= FIELD_TEXT_COLOR_A;
        if (mine) {
            memcpy(over, f, sizeof over);
            for (int i = 0; i < value_count; i++)
                if (values[i].id == eid.id && values[i].field <= FIELD_TEXT_COLOR_A)
                    over[values[i].field - FIELD_TEXT_COLOR_R] = values[i].value;
            tf = over;
        }
    }
    Clay_TextElementConfig c = {0};
    c.textColor = color(tf);
    c.fontId = tf[4], c.fontSize = tf[5], c.letterSpacing = tf[6], c.lineHeight = tf[7];
    c.textAlignment = al[(int)tf[8]], c.wrapMode = wm[(int)tf[9]];
    if (node_count < MAX_NODES) {
        const int32_t node = node_count++;
        c.userData = (void *)(uintptr_t)(node + 1);
        text_align[node] = (unsigned char)tf[8], text_wrap[node] = (unsigned char)tf[9];
    } else errors++;
    Clay__OpenTextElement(slice(copy, len), c);
}

static void hash_frame(void);

/** Closes the layout: Clay computes the boxes. Returns the command count, and hashes the frame for `ui_hash`. */
EXPORT("ui_end") int32_t ui_end(float dt)
{
    cmds = Clay_EndLayout(dt);
    // the commands, as page.c's records: the drawing's view of the same frame
    command_count = 0;
    for (int32_t i = 0; i < cmds.length && command_count < MAX_COMMANDS; i++) {
        const Clay_RenderCommand *rc = Clay_RenderCommandArray_Get(&cmds, i);
        WebCommand *c = &commands[command_count++];
        c->type = (int32_t)rc->commandType;
        c->id = (int32_t)rc->id;
        c->x = rc->boundingBox.x, c->y = rc->boundingBox.y;
        c->w = rc->boundingBox.width, c->h = rc->boundingBox.height;
        c->color = 0;
        for (int k = 0; k < 4; k++) c->radius[k] = 0, c->border[k] = 0;
        c->text = 0, c->textLength = 0, c->fontId = 0, c->fontSize = 0;
        switch (rc->commandType) {
        case CLAY_RENDER_COMMAND_TYPE_RECTANGLE: {
            c->color = pack(rc->renderData.rectangle.backgroundColor);
            c->radius[0] = rc->renderData.rectangle.cornerRadius.topLeft;
            c->radius[1] = rc->renderData.rectangle.cornerRadius.topRight;
            c->radius[2] = rc->renderData.rectangle.cornerRadius.bottomRight;
            c->radius[3] = rc->renderData.rectangle.cornerRadius.bottomLeft;
            break;
        }
        case CLAY_RENDER_COMMAND_TYPE_BORDER: {
            c->color = pack(rc->renderData.border.color);
            c->radius[0] = rc->renderData.border.cornerRadius.topLeft;
            c->radius[1] = rc->renderData.border.cornerRadius.topRight;
            c->radius[2] = rc->renderData.border.cornerRadius.bottomRight;
            c->radius[3] = rc->renderData.border.cornerRadius.bottomLeft;
            c->border[0] = rc->renderData.border.width.left;
            c->border[1] = rc->renderData.border.width.right;
            c->border[2] = rc->renderData.border.width.top;
            c->border[3] = rc->renderData.border.width.bottom;
            break;
        }
        case CLAY_RENDER_COMMAND_TYPE_TEXT: {
            c->color = pack(rc->renderData.text.textColor);
            c->text = (uint32_t)(uintptr_t)rc->renderData.text.stringContents.chars;
            c->textLength = (uint32_t)rc->renderData.text.stringContents.length;
            c->fontId = rc->renderData.text.fontId;
            c->fontSize = rc->renderData.text.fontSize;
            break;
        }
        default: break;
        }
    }
    hash_frame();
    return cmds.length;
}

// The frame's hash: FNV-1a over what a draw reads and nothing else. The desktop's folds its renderer's tables in beside
// the commands; there are none here, so a frame that hashes the same draws the same pixels of this target.
static uint64_t hash_bytes(uint64_t h, const void *p, size_t n)
{
    const unsigned char *b = p;
    for (size_t i = 0; i < n; i++) h = (h ^ b[i]) * 0x100000001b3ull;
    return h;
}

static uint64_t hash_u32(uint64_t h, uint32_t v) { return hash_bytes(h, &v, sizeof v); }

static uint64_t hash_f32(uint64_t h, float v)
{
    uint32_t bits;
    memcpy(&bits, &v, sizeof bits);
    return hash_u32(h, bits);
}

static uint64_t hash_color(uint64_t h, Clay_Color c)
{
    h = hash_f32(h, c.r), h = hash_f32(h, c.g), h = hash_f32(h, c.b);
    return hash_f32(h, c.a);
}

static uint64_t hash_corners(uint64_t h, Clay_CornerRadius c)
{
    h = hash_f32(h, c.topLeft), h = hash_f32(h, c.topRight);
    h = hash_f32(h, c.bottomRight);
    return hash_f32(h, c.bottomLeft);
}

static uint64_t hash_rect(uint64_t h, Clay_BoundingBox b)
{
    h = hash_f32(h, b.x), h = hash_f32(h, b.y), h = hash_f32(h, b.width);
    return hash_f32(h, b.height);
}

static void hash_frame(void)
{
    uint64_t h = 0xcbf29ce484222325ull;
    for (int32_t i = 0; i < cmds.length; i++) {
        const Clay_RenderCommand *c = &cmds.internalArray[i];
        h = hash_u32(h, (uint32_t)c->commandType);
        h = hash_u32(h, c->id);
        h = hash_rect(h, c->boundingBox);
        switch (c->commandType) {
        case CLAY_RENDER_COMMAND_TYPE_RECTANGLE:
            h = hash_color(h, c->renderData.rectangle.backgroundColor);
            h = hash_corners(h, c->renderData.rectangle.cornerRadius);
            break;
        case CLAY_RENDER_COMMAND_TYPE_BORDER:
            h = hash_color(h, c->renderData.border.color);
            h = hash_corners(h, c->renderData.border.cornerRadius);
            h = hash_u32(h, (uint32_t)c->renderData.border.width.left);
            h = hash_u32(h, (uint32_t)c->renderData.border.width.right);
            h = hash_u32(h, (uint32_t)c->renderData.border.width.top);
            h = hash_u32(h, (uint32_t)c->renderData.border.width.bottom);
            h = hash_u32(h, (uint32_t)c->renderData.border.width.betweenChildren);
            break;
        case CLAY_RENDER_COMMAND_TYPE_TEXT: {
            const Clay_StringSlice s = c->renderData.text.stringContents;
            h = hash_color(h, c->renderData.text.textColor);
            h = hash_u32(h, (uint32_t)c->renderData.text.fontId);
            h = hash_u32(h, (uint32_t)c->renderData.text.fontSize);
            h = hash_u32(h, (uint32_t)c->renderData.text.letterSpacing);
            h = hash_u32(h, (uint32_t)c->renderData.text.lineHeight);
            h = hash_u32(h, (uint32_t)(s.length > 0 ? s.length : 0));
            if (s.length > 0) h = hash_bytes(h, s.chars, (size_t)s.length);
            break;
        }
        case CLAY_RENDER_COMMAND_TYPE_SCISSOR_START:
        case CLAY_RENDER_COMMAND_TYPE_SCISSOR_END:
            h = hash_u32(h, c->renderData.clip.horizontal);
            h = hash_u32(h, c->renderData.clip.vertical);
            break;
        default: break;
        }
    }
    frame_hash = h;
}

/** The hash of the last frame's commands: the same value twice means the same pixels. */
EXPORT("ui_hash") uint64_t ui_hash(void) { return frame_hash; }

/** Draws of the page (ui_draw calls): the raster is JS's, so this is only the count a test reads. */
EXPORT("ui_draw") void ui_draw(void) { draw_count++; }

EXPORT("ui_draws") int32_t ui_draws(void) { return draw_count; }

// ---------- the frame as data: solid/src/dump.ts, the goldens in solid/goldens ----------

/** The last frame as clay_dump.c's tables: the commands, the page's id strings, the text's own two fields and an empty
 *  effect table (this target has no renderer besides the commands). */
static ClayDumpFrame dump_frame(void)
{
    return (ClayDumpFrame){
        .commands = cmds,
        .width = width,
        .height = height,
        .scale = 1,
        .hash = frame_hash,
        .names = id_names,
        .nameCount = id_name_count,
        .nodeIds = NULL,
        .nodeCount = node_count,
        .textAlign = text_align,
        .textWrap = text_wrap,
        .textWeight = 0,
        .shadows = NULL,
        .shadowCount = 0,
        .backdrops = NULL,
        .backdropCount = 0,
        .gradients = NULL,
        .gradientCount = 0,
        .groups = NULL,
        .groupCount = 0,
    };
}

static char *dump_bytes;
static int32_t dump_length;

/** The last frame as JSON, replacing the previous one: its length, and its bytes at dump_ptr(). */
EXPORT("dump") int32_t ui_dump(void)
{
    const ClayDumpFrame frame = dump_frame();
    const ClayDump dump = Clay_DumpFrame(&frame);
    free(dump_bytes);
    dump_bytes = dump.bytes, dump_length = dump.length;
    return dump_length;
}

EXPORT("dump_ptr") char *ui_dump_bytes(void) { return dump_bytes; }

EXPORT("cmd_count") int32_t ui_command_count(void) { return command_count; }
EXPORT("cmd_size") int32_t ui_command_size(void) { return (int32_t)sizeof(WebCommand); }
EXPORT("cmds") WebCommand *ui_commands(void) { return commands; }

/** The box of the element with that id, in the layout of the last frame, into out[4] (x, y, w, h); 0 when there is no
 *  such element. */
EXPORT("ui_bounds") int32_t ui_bounds(const char *id, int32_t len, float *out)
{
    const Clay_ElementData d = Clay_GetElementData(Clay__HashString(slice(id, len), 0));
    if (!d.found) return 0;
    out[0] = d.boundingBox.x, out[1] = d.boundingBox.y, out[2] = d.boundingBox.width;
    out[3] = d.boundingBox.height;
    return 1;
}

/** The scroll offset of the clip element with that id along `axis` (0 y, 1 x); 0 when there is none. */
EXPORT("ui_scroll_offset") float ui_scroll_offset(const char *id, int32_t len, int32_t axis)
{
    const Clay_ScrollContainerData d = Clay_GetScrollContainerData(Clay__HashString(slice(id, len), 0));
    if (!d.found) return 0;
    return axis ? d.scrollPosition->x : d.scrollPosition->y;
}

/** Scrolls the clip element with that id to `v` on `axis`, clamped to its content; the offset it took. */
EXPORT("ui_scroll_to") float ui_scroll_to(const char *id, int32_t len, int32_t axis, float v)
{
    const Clay_ScrollContainerData d = Clay_GetScrollContainerData(Clay__HashString(slice(id, len), 0));
    if (!d.found) return 0;
    if (axis) {
        const float lowest = -fmaxf(d.contentDimensions.width - d.scrollContainerDimensions.width, 0);
        d.scrollPosition->x = fminf(fmaxf(v, lowest), 0);
        return d.scrollPosition->x;
    }
    const float lowest = -fmaxf(d.contentDimensions.height - d.scrollContainerDimensions.height, 0);
    d.scrollPosition->y = fminf(fmaxf(v, lowest), 0);
    return d.scrollPosition->y;
}

/** Puts a clip element's offset where the page says, past its content too: a rubber band's overscroll. */
EXPORT("ui_scroll_put") float ui_scroll_put(const char *id, int32_t len, int32_t axis, float v)
{
    const Clay_ScrollContainerData d = Clay_GetScrollContainerData(Clay__HashString(slice(id, len), 0));
    if (!d.found) return 0;
    if (axis) d.scrollPosition->x = v;
    else d.scrollPosition->y = v;
    return v;
}

/** A finger's position, normalised (0..1) in the layout's pixels: the desktop's mapping, for a page that takes a touch. */
EXPORT("ui_touch_map") void ui_touch_map(float fx, float fy, float *out)
{
    out[0] = fx * width;
    out[1] = fy * height;
}
