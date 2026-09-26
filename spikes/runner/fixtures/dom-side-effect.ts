// A dependency that touches the DOM at module top level, like a component library often does.
document.title = "hello";
export const title = document.title;
