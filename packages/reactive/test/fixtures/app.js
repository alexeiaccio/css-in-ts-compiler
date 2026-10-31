import "virtual:cssints.css";
import { listen } from "@cssints/reactive/runtime";
import * as page from "./page.ts";

const card = 'style="padding:8px;margin:8px;outline:1px solid #999"';
const panel = 'style="height:20px;background:#9f9"';

document.body.innerHTML = `
<div id=a class="${page.aCard}" ${card}>
  <button id=a-btn class="${page.aButton}">a</button>
  <div id=a-panel class="${page.aPanel}" ${panel}></div>
</div>
<div id=b class="${page.bCard}" ${card}>
  <button id=b-btn class="${page.bButton}">b</button>
  <div id=b-panel class="${page.bPanel}" ${panel}></div>
</div>
<div id=c class="${page.cCard}" ${card}>
  <button id=c-btn class="${page.cButton}">c</button>
  <div id=c-panel class="${page.cPanel}" ${panel}></div>
</div>
<div id=t class="${page.tabList}" ${card}>
  <button id=t1 class="${page.tabOne}">one</button>
  <button id=t2 class="${page.tabTwo}">two</button>
  <div id=p1 class="${page.panelOne}" ${panel}></div>
  <div id=p2 class="${page.panelTwo}" ${panel}></div>
</div>
<div id=outer class="${page.outerCard}" ${card}>
  <button id=out-btn class="${page.outerButton}">outer</button>
  <div id=out-panel class="${page.outerPanel}" ${panel}></div>
  <div id=inner class="${page.innerCard}" ${card}>
    <button id=in-btn class="${page.innerButton}">inner</button>
    <div id=in-panel class="${page.innerPanel}" ${panel}></div>
  </div>
</div>
<div id=s class="${page.selectCard}" ${card}>
  <select id=s-field class="${page.selectField}">
    <option value=one selected>one</option>
    <option value=two>two</option>
  </select>
  <div id=s1 class="${page.selectOne}" ${panel}></div>
  <div id=s2 class="${page.selectTwo}" ${panel}></div>
</div>
<div id=f class="${page.checkCard}" ${card}>
  <input id=f-field type=checkbox class="${page.checkbox}">
  <div id=f-panel class="${page.checkPanel}" ${panel}></div>
</div>
<div id=m class="${page.multiCard}" ${card}>
  <div id=m-field class="${page.multiField}" tabindex=0>multi</div>
  <div id=m-open class="${page.multiOpen}" ${panel}></div>
  <div id=m-two class="${page.multiTwo}" ${panel}></div>
</div>
<div id=d class="${page.dupCard}" ${card}>
  <button id=d-btn class="${page.dupButton}">d</button>
  <div id=d-panel class="${page.dupPanel}" ${panel}></div>
</div>
<div id=pr class="${page.persistCard}" ${card}>
  <button id=pr-btn class="${page.persistButton}">persist</button>
  <div id=pr-panel class="${page.persistPanel}" ${panel}></div>
</div>
<div id=sv class="${page.valueCard}" ${card}>
  <div id=sv-panel class="${page.valuePanel}" ${panel}></div>
</div>
<div id=np class="${page.plainCard}" ${card}>
  <button id=np-btn class="${page.plainButton}">plain</button>
  <div id=np-panel class="${page.plainPanel}" ${panel}></div>
</div>
<div id=st class="${page.stripList}" ${card}>
  <button id=st1 class="${page.stripOne}">one</button>
  <button id=st2 class="${page.stripTwo}">two</button>
  <button id=st3 class="${page.stripThree}">three</button>
  <button id=stp class="${page.stripPressed}">press</button>
</div>
<form id=form class="${page.form}" ${card}>
  <button id=form-go class="${page.formButton}">save</button>
</form>
<div id=hit-card class="${page.hitCard}" ${card}>
  <button id=hit-btn class="${page.hitButton}">hit</button>
</div>
`;

// emit(): the app hears the hand-off with listen() from the runtime module, the same name emit() was given. The form's
// own listener prevents the navigation a submit would cause; the page's proves the event bubbles.
const log = (window.rxLog = []);
const note = (from) => (event) =>
  log.push({
    from,
    type: event.type,
    native: event.detail.event.type,
    submitEvent: event.detail.event instanceof SubmitEvent,
    owner: event.detail.owner?.id ?? null,
    target: event.detail.event.target?.id ?? null,
  });
window.rxDetach = listen(document.getElementById("form"), "save", note("form"));
listen(document.getElementById("form"), "save", (event) => event.detail.event.preventDefault());
listen(document, "save", note("document"));
listen(document, "hit", note("hit"));
