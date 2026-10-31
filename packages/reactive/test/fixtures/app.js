import "virtual:cssints.css";
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
`;
