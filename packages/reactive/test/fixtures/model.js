import "virtual:cssints.css";
import * as page from "./model.ts";

// The model's parts as a page. A div with tabindex is the click target where a
// key must not synthesize a click (the keydown program on `<div id=outer>` is
// what an ancestor program test presses).
document.body.innerHTML = `
<div id=outer class="${page.outerCard}">
  <div id=outer-btn class="${page.outerButton}" tabindex=0>outer</div>
  <div id=outer-tab-1 class="${page.outerTabOne}" role=tab>one</div>
  <div id=outer-tab-2 class="${page.outerTabTwo}" role=tab>two</div>
  <select id=outer-field class="${page.outerField}">
    <option value=one selected>one</option>
    <option value=two>two</option>
  </select>
  <div id=outer-panel class="${page.outerPanel}"></div>
  <div id=inner class="${page.innerCard}">
    <div id=inner-btn class="${page.innerButton}" tabindex=0>inner</div>
    <div id=inner-tab-1 class="${page.innerTabOne}" role=tab>one</div>
    <div id=inner-tab-2 class="${page.innerTabTwo}" role=tab>two</div>
    <input id=inner-check type=checkbox class="${page.innerCheck}">
    <div id=inner-panel class="${page.innerPanel}"></div>
  </div>
</div>
`;
