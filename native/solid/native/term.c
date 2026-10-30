// Clay over a grid of character cells and termbox2, behind flat C functions for bun:ffi: the terminal's counterpart of
// solid/native/ui.c. A page declares through the same surface (a packed 45-float box style, a 10-float text style, the
// value channel), so a page's styles.ts is the same module on both targets; what differs is the target underneath:
//
//   ui.c    ThorVG's software raster + an SDL3 window: a style's pixels
//   term.c  terminal/cells.c + render.c + measure.c + tb2.c: a style's cells (terminal/render.c maps the commands)
//
// ui.c cannot take a different measure (it hard-codes Clay_ThorVG_MeasureText and draws into a pixel buffer), and the
// terminal does not link SDL3, ThorVG or a window at all, so this is the "thin terminal variant" as its own file. The
// declaration part is ui.c's, field for field (the order is solid/README.md's table, mirrored by solid/src/pack.ts);
// the parts of a style a cell cannot show are not declared there: a float, a shadow, a backdrop, a gradient, an image.
//
// One frame from JS: term_begin, term_open/term_text/term_close in tree order, term_end (Clay lays out, render.c turns
// the commands into cells), then term_present (cells -> termbox2) or term_dump/term_ansi (headless).
#define CLAY_IMPLEMENTATION
#include "clay.h"

#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cells.h"
#include "measure.h"
#include "render.h"
#include "tb2.h"

// A box's fields, as ui.c takes them (solid/src/pack.ts packs the same order).
#define STYLE_FIELDS 45
// A text's fields, as ui.c takes them.
#define TEXT_FIELDS 10
// The value channel's fields past the style's own: ui.c's 45 (a shadow's blur), 46/47/48/49 (a subtree's opacity, scale
// and translate), 50 (a gradient's opacity), 51..54 (a text's colour) and 55 (a rotation). A cell has no alpha, scale,
// offset, gradient, rotation or shadow, so those are accepted and ignored: a page's entry animation is a no-op in cells,
// not an error. The text colour is the one that cannot be ignored — it is a glyph's ink — so 51..54 is applied.
#define FIELD_SHADOW_BLUR 45
#define FIELD_TEXT_COLOR_R 51
#define FIELD_TEXT_COLOR_A 54
#define FIELD_ROTATE 55

// ponytail: 64 KB of text a frame and 64 value overrides a frame, as ui.c; a longer page needs bigger tables
#define ARENA_SIZE (1 << 16)
#define MAX_VALUES 64

static Cells grid;
static Clay_RenderCommandArray cmds;
static int cols = 80, rows = 20;
static int tty; // 1: termbox2 owns the terminal, and term_present/term_poll have something to talk to
static int errors;
static char arena[ARENA_SIZE];
static int arena_used;

// The value channel: this frame's overrides of a packed style, by element id, written by the page (or a host) after
// term_begin and read by term_open/term_text.
static struct {
    uint32_t id;
    uint16_t field;
    float value;
} values[MAX_VALUES];
static int value_count;

static void on_error(Clay_ErrorData e)
{
    errors++;
    fprintf(stderr, "clay error %d: %.*s\n", (int)e.errorType, (int)e.errorText.length, e.errorText.chars);
}

static Clay_String slice(const char *s, int len) { return (Clay_String){.length = len, .chars = s}; }

/**
 * Starts the frame: cols x rows cells, headless (cols and rows > 0), or termbox2's own size and its truecolour/256
 * output mode (0, 0). 0 on success, 2 when termbox2 cannot open /dev/tty. termbox2 is only opened for the live mode, so
 * --dump and --ansi work with no terminal.
 */
int term_open(int c, int r)
{
    if (c > 0 && r > 0) {
        cols = c, rows = r;
    } else {
        if (term_tb2_open(&cols, &rows, TB2_COLORS_AUTO) != 0) return 2;
        tty = 1;
    }
    if (cols < 4) cols = 4;
    if (rows < 3) rows = 3;
    const uint32_t size = Clay_MinMemorySize();
    Clay_Initialize(Clay_CreateArenaWithCapacityAndMemory(size, malloc(size)),
                    (Clay_Dimensions){(float)(cols * CELL_W), (float)(rows * CELL_H)}, (Clay_ErrorHandler){on_error});
    Clay_SetMeasureTextFunction(term_measure_text, NULL);
    cells_init(&grid, cols, rows);
    return 0;
}

/** The terminal's new size after a resize (TB2_RESIZE), and the grid at it. Nothing when headless. */
void term_resize(void)
{
    if (!tty) return;
    int c, r;
    term_tb2_size(&c, &r);
    if (c < 4) c = 4;
    if (r < 3) r = 3;
    if (c == cols && r == rows) return;
    cols = c, rows = r;
    cells_free(&grid);
    cells_init(&grid, cols, rows);
}

/** The grid's size into out[2] = cols, rows. */
void term_size(int *out) { out[0] = cols, out[1] = rows; }

/** Pointer (in cells) and button for this frame, then Clay opens the layout. */
void term_begin(float px, float py, int down, float dt)
{
    (void)dt;
    arena_used = 0;
    value_count = 0;
    Clay_SetLayoutDimensions((Clay_Dimensions){(float)(cols * CELL_W), (float)(rows * CELL_H)});
    // the pointer termbox2 last reported, in Clay's pixels; a cell's middle is not a point a page can read, so the
    // cell's top-left is the pointer, as main.c does
    Clay_SetPointerState((Clay_Vector2){px * CELL_W, py * CELL_H}, down);
    Clay_BeginLayout();
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

/** An override of one number of the style of the element with that id, for this frame only. 0..44 is a packed field,
 *  45..55 the fields a cell has no use for (accepted and ignored) but a page may still write, 51..54 the colour of a
 *  text element with that id. Out of range, or past 64 a frame, is counted as an error and dropped. */
void term_value(const char *id, int len, int field, float value)
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
void term_open_element(const char *id, int len, const float *style)
{
    static const Clay_LayoutAlignmentX ax[3] = {CLAY_ALIGN_X_LEFT, CLAY_ALIGN_X_CENTER, CLAY_ALIGN_X_RIGHT};
    static const Clay_LayoutAlignmentY ay[3] = {CLAY_ALIGN_Y_TOP, CLAY_ALIGN_Y_CENTER, CLAY_ALIGN_Y_BOTTOM};
    Clay_ElementId eid = {0};
    float over[STYLE_FIELDS];
    const float *f = style;
    if (id) {
        eid = Clay__HashString(slice(id, len), 0);
        // the value channel: this element's overrides, applied to a copy of its own floats, so a frame that uses none
        // declares from the style's literal (the terminal's cell re-cut is the same channel, not a second path)
        int mine = 0;
        for (int i = 0; i < value_count; i++)
            mine += values[i].id == eid.id && values[i].field < STYLE_FIELDS;
        if (mine) {
            memcpy(over, style, sizeof over);
            for (int i = 0; i < value_count; i++)
                if (values[i].id == eid.id && values[i].field < STYLE_FIELDS) over[values[i].field] = values[i].value;
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
    // a clip element is a scroll container: the offset Clay kept for it across frames shifts its children
    if (d.clip.horizontal || d.clip.vertical) d.clip.childOffset = Clay_GetScrollOffset();
    // 32..44 are a float's fields (css.floating). A terminal cannot place one over another element's cells yet, so a
    // page with a float declares it as a plain box here: the honest limit of this slice, counted so it is not silent
    if (f[32] != 0) errors++;
    if (id) Clay__OpenElementWithId(eid);
    else Clay__OpenElement();
    Clay__ConfigureOpenElement(d);
}

void term_close_element(void) { Clay__CloseElement(); }

/** A text element, with an id (an override of its colour) or NULL. The bytes are copied for the frame. */
void term_text(const char *id, int len, const char *s, int slen, const float *f)
{
    static const Clay_TextAlignment al[3] = {CLAY_TEXT_ALIGN_LEFT, CLAY_TEXT_ALIGN_CENTER, CLAY_TEXT_ALIGN_RIGHT};
    static const Clay_TextElementConfigWrapMode wm[3] = {CLAY_TEXT_WRAP_WORDS, CLAY_TEXT_WRAP_NEWLINES,
                                                         CLAY_TEXT_WRAP_NONE};
    if (arena_used + slen > ARENA_SIZE) {
        errors++;
        return;
    }
    char *copy = arena + arena_used;
    memcpy(copy, s, (size_t)slen);
    arena_used += slen;
    float over[TEXT_FIELDS];
    const float *tf = f;
    if (id) {
        const Clay_ElementId eid = Clay__HashString(slice(id, len), 0);
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
    Clay__OpenTextElement(slice(copy, slen), c);
}

/** Closes the layout and draws the commands into the cells. Returns the command count. */
int term_end(float dt)
{
    cmds = Clay_EndLayout(dt);
    cells_clear(&grid);
    term_render(&grid, &cmds);
    return cmds.length;
}

/** The cells to the terminal, termbox2's diff: a frame at rest writes nothing. Nothing when headless. */
void term_present(void) { term_tb2_present(&grid); }

/**
 * Waits up to 16ms for termbox2's next event. 3: the terminal is gone (quit); 2: a resize (term_resize, then a frame);
 * 1: an event, its key into key[cap] (empty for a pointer's edge) and out[3] = the pointer's cell x, y and the button
 * (down 1, released 0; x is -1 when the event was not the mouse, which is always: termbox2 reports no motion);
 * 0: nothing within the timeout.
 */
int term_poll(char *key, int cap, float *out)
{
    if (key && cap > 0) key[0] = 0;
    out[0] = -1, out[1] = -1, out[2] = 0;
    if (!tty) return 3;
    TermEvent ev = {.px = -1, .py = -1};
    const Tb2Status s = term_tb2_poll_ms(&ev, 16);
    if (s == TB2_QUIT) return 3;
    if (s == TB2_RESIZE) return 2;
    if (s != TB2_EVENT) return 0;
    if (ev.px >= 0) out[0] = (float)ev.px, out[1] = (float)ev.py, out[2] = (float)ev.down;
    if (ev.key && key && cap > 1) {
        strncpy(key, ev.key, (size_t)(cap - 1));
        key[cap - 1] = 0;
        return 1;
    }
    return ev.px >= 0 ? 1 : 0;
}

// The grid out: the two ways main.c writes a frame. A path that is empty or "-" is stdout.
static FILE *open_out(const char *path, const char *mode)
{
    FILE *f = !path || !*path || !strcmp(path, "-") ? stdout : fopen(path, mode);
    if (!f) fprintf(stderr, "%s: %s\n", path ? path : "-", strerror(errno));
    return f;
}

/** The last frame as plain text (cells_dump: '.' is a fill): the dump the C host writes. 0 on success. */
int term_dump(const char *path)
{
    FILE *f = open_out(path, "w");
    if (!f) return 1;
    cells_dump(&grid, f);
    if (f != stdout) fclose(f);
    return 0;
}

/** The last frame as ANSI truecolour (cells_ansi: SGR runs merged). 0 on success. */
int term_ansi(const char *path)
{
    FILE *f = open_out(path, "wb");
    if (!f) return 1;
    cells_ansi(&grid, f);
    if (f != stdout) fclose(f);
    return 0;
}

/** True when the pointer is over the element of that id in the layout of the last frame. */
int term_over(const char *id, int len)
{
    return Clay_PointerOver(Clay__HashString(slice(id, len), 0)) ? 1 : 0;
}

int term_errors(void) { return errors; }

/** Gives the terminal back and reports what the renderer could not draw (an image, a custom command). */
void term_close(void)
{
    term_render_report();
    if (tty) term_tb2_close();
    cells_free(&grid);
}
