use lightningcss::stylesheet::{PrinterOptions, StyleSheet};
use lightningcss::targets::Targets;
use lightningcss::traits::ToCss;
use lightningcss::values::color::CssColor;
use lightningcss::values::length::{Length, LengthPercentage};
use napi_derive::napi;

// ============================================================================
// Error Formatting
// ============================================================================

fn format_error(e: lightningcss::error::Error<impl std::fmt::Display>) -> napi::Error {
    let msg = if let Some(loc) = &e.loc {
        format!(
            "{} at {}:{}:{}",
            e.kind,
            loc.filename,
            loc.line + 1,
            loc.column
        )
    } else {
        e.kind.to_string()
    };
    napi::Error::from_reason(msg)
}

// ============================================================================
// Options Types
// ============================================================================

#[napi(object)]
#[derive(Debug, Default)]
pub struct ParseOptions {
    pub filename: Option<String>,
    pub error_recovery: Option<bool>,
}

#[napi(object)]
#[derive(Debug, Default)]
pub struct PrinterOptionsJS {
    pub minify: Option<bool>,
    pub source_map: Option<bool>,
}

fn to_printer_options(opts: PrinterOptionsJS) -> PrinterOptions<'static> {
    PrinterOptions {
        minify: opts.minify.unwrap_or(false),
        targets: Targets::default(),
        ..Default::default()
    }
}

// ============================================================================
// Parse — Full stylesheet
// ============================================================================

/// Parse a CSS string into a StyleSheet AST.
#[napi]
pub fn parse(css: String, options: Option<ParseOptions>) -> napi::Result<serde_json::Value> {
    let opts = lightningcss::stylesheet::ParserOptions {
        filename: options
            .as_ref()
            .and_then(|o| o.filename.clone())
            .unwrap_or_default(),
        error_recovery: options
            .as_ref()
            .and_then(|o| o.error_recovery)
            .unwrap_or(false),
        ..Default::default()
    };
    let stylesheet = StyleSheet::parse(&css, opts).map_err(format_error)?;
    serde_json::to_value(&stylesheet).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// ============================================================================
// toCss — Full stylesheet serialization
// ============================================================================

/// Serialize a StyleSheet AST back to a CSS string.
#[napi]
pub fn to_css(ast: serde_json::Value, options: Option<PrinterOptionsJS>) -> napi::Result<String> {
    let stylesheet = deserialize_stylesheet(ast)?;
    let result = stylesheet
        .to_css(to_printer_options(options.unwrap_or_default()))
        .map_err(format_error)?;
    Ok(result.code)
}

/// Deserialize a JSON AST into a StyleSheet with 'static lifetimes.
///
/// Strategy: serialize AST to JSON string, leak it to get &'static str,
/// parse with serde. The StyleSheet borrows from the leaked string,
/// which is fine since we drop it after serialization.
fn deserialize_stylesheet(ast: serde_json::Value) -> napi::Result<StyleSheet<'static, 'static>> {
    let json_str =
        serde_json::to_string(&ast).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    let leaked: &'static str = Box::leak(json_str.into_boxed_str());
    serde_json::from_str::<'static>(leaked)
        .map_err(|e| napi::Error::from_reason(format!("Invalid StyleSheet AST: {e}")))
}

// ============================================================================
// toCssString — Auto-detect AST node type
// ============================================================================

/// Serialize any AST node to a CSS string. Auto-detects the node type
/// from the JSON structure.
#[napi]
pub fn to_css_string(
    node: serde_json::Value,
    options: Option<PrinterOptionsJS>,
) -> napi::Result<String> {
    let printer_opts = to_printer_options(options.unwrap_or_default());

    // Try StyleSheet first (has "rules" key)
    if node.get("rules").is_some() {
        let ss = deserialize_stylesheet(node)?;
        return ss
            .to_css(printer_opts)
            .map(|r| r.code)
            .map_err(format_error);
    }

    // Try CssColor
    if let Some(
        "rgb" | "hsl" | "current-color" | "hwb" | "lab" | "lch" | "oklab" | "oklch" | "color-mix"
        | "light-dark" | "color" | "rgba",
    ) = node.get("type").and_then(|t| t.as_str())
    {
        if let Ok(c) = serde_json::from_value::<CssColor>(node.clone()) {
            return c
                .to_css_string(printer_opts)
                .map_err(|e| napi::Error::from_reason(e.to_string()));
        }
    }

    // Try LengthPercentage
    if let Some("dimension" | "percentage") = node.get("type").and_then(|t| t.as_str()) {
        if let Ok(lp) = serde_json::from_value::<LengthPercentage>(node.clone()) {
            return lp
                .to_css_string(printer_opts)
                .map_err(|e| napi::Error::from_reason(e.to_string()));
        }
    }

    // Try Length
    if let Some("value" | "calc") = node.get("type").and_then(|t| t.as_str()) {
        if node.get("value").is_some() {
            if let Ok(l) = serde_json::from_value::<Length>(node.clone()) {
                return l
                    .to_css_string(printer_opts)
                    .map_err(|e| napi::Error::from_reason(e.to_string()));
            }
        }
    }

    Err(napi::Error::from_reason(
        "Could not determine AST node type. Expected StyleSheet, Length, LengthPercentage, or CssColor.",
    ))
}

// ============================================================================
// Typed Helpers
// ============================================================================

/// Serialize a Length AST node to CSS string (e.g. "16px").
#[napi]
pub fn to_css_length(ast: serde_json::Value) -> napi::Result<String> {
    let length: Length = serde_json::from_value(ast)
        .map_err(|e| napi::Error::from_reason(format!("Invalid Length AST: {e}")))?;
    length
        .to_css_string(PrinterOptions::default())
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// Serialize a CssColor AST node to CSS string (e.g. "rgb(255, 0, 0)").
#[napi]
pub fn to_css_color(ast: serde_json::Value) -> napi::Result<String> {
    let color: CssColor = serde_json::from_value(ast)
        .map_err(|e| napi::Error::from_reason(format!("Invalid CssColor AST: {e}")))?;
    color
        .to_css_string(PrinterOptions::default())
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// Serialize a LengthPercentage AST node to CSS string.
#[napi]
pub fn to_css_length_percentage(ast: serde_json::Value) -> napi::Result<String> {
    let lp: LengthPercentage = serde_json::from_value(ast)
        .map_err(|e| napi::Error::from_reason(format!("Invalid LengthPercentage AST: {e}")))?;
    lp.to_css_string(PrinterOptions::default())
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
