import {getEventName} from "../util/compatibility";
import {MenuItem} from "./MenuItem";

export class Help extends MenuItem {
    constructor(vditor: IVditor, menuItem: IMenuItem) {
        super(vditor, menuItem);
        this.element.children[0].addEventListener(getEventName(), (event) => {
            event.preventDefault();
            vditor.tip.show(`<div style="margin-bottom:14px;font-size: 14px;line-height: 22px;min-width:300px;max-width: 360px;display: flex;">
<div style="margin-top: 14px;flex: 1">
    <div>Markdown Guide</div>
    <ul style="list-style: none">
        <li><a href="https://ld246.com/article/1583308420519" target="_blank">Syntax Quick Reference</a></li>
        <li><a href="https://ld246.com/article/1583129520165" target="_blank">Basic Syntax</a></li>
        <li><a href="https://ld246.com/article/1583305480675" target="_blank">Extended Syntax</a></li>
        <li><a href="https://ld246.com/article/1582778815353" target="_blank">Keyboard Shortcuts</a></li>
    </ul>
</div>
<div style="margin-top: 14px;flex: 1">
    <div>Vditor Support</div>
    <ul style="list-style: none">
        <li><a href="https://github.com/Vanessa219/vditor/issues" target="_blank">Issues</a></li>
        <li><a href="https://ld246.com/tag/vditor" target="_blank">Official Discussions</a></li>
        <li><a href="https://ld246.com/article/1549638745630" target="_blank">Developer Guide</a></li>
        <li><a href="https://ld246.com/guide/markdown" target="_blank">Demo</a></li>
    </ul>
</div></div>`, 0);
        });
    }
}
