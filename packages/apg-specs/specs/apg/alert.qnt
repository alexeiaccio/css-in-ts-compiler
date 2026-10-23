// APG Alert — https://www.w3.org/WAI/ARIA/apg/patterns/alert/
//
// A brief, important message in a role=alert live region. The APG contract the
// machine checks:
//   - a message rendered or changed AFTER page load is announced;
//   - a message already present when the page finished loading is NOT announced
//     (screen readers ignore alerts present before load completes);
//   - an alert never takes keyboard focus (that is the alertdialog pattern);
//   - an alert never disappears on its own (WCAG 2.2.3): there is no timer
//     event, the only way out is the user's `dismiss`.
//
// Events:
//   show        render a new message (mounts the alert, or replaces its text)
//   load        the page finishes loading
//   dismiss     the user closes the alert
//   focusTask / focusOther   the user moves focus around the page
//
// ids: every `show` takes a fresh message id; `announced` is the id the
// assistive technology last spoke (0 = nothing yet), `preloaded` the id that
// was already rendered when the page finished loading (0 = none).
//
// ponytail: queueing / politeness (aria-live=assertive vs polite) is not
// modelled; add a `queue` var if overlapping alerts matter.
module apg_alert {
  var loaded: bool        // page load completed
  var mounted: bool       // the alert element is in the DOM
  var role: str           // rendered role: "alert" | "none"
  var message: int        // id of the message currently shown (0 = none)
  var nextId: int         // the next message id to hand out
  var announced: int      // last message id announced by AT (0 = none)
  var announcements: int  // number of announcements so far
  var preloaded: int      // message id present at load time (0 = none)
  var focus: str          // "task" | "other" | "alert"
  var dismissals: int     // user dismissals

  action init = all {
    loaded' = false,
    mounted' = false,
    role' = "none",
    message' = 0,
    nextId' = 1,
    announced' = 0,
    announcements' = 0,
    preloaded' = 0,
    focus' = "task",
    dismissals' = 0
  }

  // before load the message renders silently; after load it is announced
  action show = all {
    loaded' = loaded,
    mounted' = true,
    role' = "alert",
    message' = nextId,
    nextId' = nextId + 1,
    announced' = if (loaded) nextId else announced,
    announcements' = if (loaded) announcements + 1 else announcements,
    preloaded' = if (loaded) preloaded else nextId,
    focus' = focus,
    dismissals' = dismissals
  }

  action load = all {
    loaded' = true,
    mounted' = mounted,
    role' = role,
    message' = message,
    nextId' = nextId,
    announced' = announced,
    announcements' = announcements,
    preloaded' = if (loaded) preloaded else message,
    focus' = focus,
    dismissals' = dismissals
  }

  action dismiss = all {
    loaded' = loaded,
    mounted' = false,
    role' = "none",
    message' = 0,
    nextId' = nextId,
    announced' = announced,
    announcements' = announcements,
    preloaded' = preloaded,
    focus' = focus,
    dismissals' = if (mounted) dismissals + 1 else dismissals
  }

  action focusTask = all {
    loaded' = loaded,
    mounted' = mounted,
    role' = role,
    message' = message,
    nextId' = nextId,
    announced' = announced,
    announcements' = announcements,
    preloaded' = preloaded,
    focus' = "task",
    dismissals' = dismissals
  }

  action focusOther = all {
    loaded' = loaded,
    mounted' = mounted,
    role' = role,
    message' = message,
    nextId' = nextId,
    announced' = announced,
    announcements' = announcements,
    preloaded' = preloaded,
    focus' = "other",
    dismissals' = dismissals
  }

  action step = any { init, show, load, dismiss, focusTask, focusOther }

  // APG: an alert never affects keyboard focus
  val FocusNeverOnAlert: bool = focus != "alert"
  // the live-region role is present exactly while the alert is mounted
  val RoleWhenMounted: bool = (role == "alert") == mounted
  // a mounted alert carries a message, an unmounted one carries none
  val MountedHasMessage: bool = mounted == (message != 0)
  // alerts present before load completes are never announced
  val PreloadedNotAnnounced: bool = or(preloaded == 0, announced != preloaded)
  // after load, a live message is the one that was announced
  val LiveMessageAnnounced: bool = or(not(and(loaded, mounted)), or(message == preloaded, announced == message))
  // nothing is announced before the page has loaded
  val SilentBeforeLoad: bool = or(loaded, announcements == 0)
  // ids and counters only move forward
  val CountersConsistent: bool = and(announced < nextId, and(announcements >= 0, dismissals >= 0))
}
