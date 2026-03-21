import { version, config, buttonStyles } from "./macros" with { type: "macro" };

document.getElementById("app")!.innerHTML = `
<h1>oxc-macro test</h1>
<p>Version: ${version()}</p>
<p>Config: ${JSON.stringify(config())}</p>
<p>Button class: ${buttonStyles().value.className}</p>
`;
