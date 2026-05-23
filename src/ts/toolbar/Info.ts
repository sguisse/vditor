import {VDITOR_VERSION} from "../constants";
import {getEventName} from "../util/compatibility";
import {MenuItem} from "./MenuItem";

export class Info extends MenuItem {
    constructor(vditor: IVditor, menuItem: IMenuItem) {
        super(vditor, menuItem);
        this.element.children[0].addEventListener(getEventName(), (event) => {
            event.preventDefault();
            vditor.tip.show(`<div style="max-width: 520px; font-size: 14px;line-height: 22px;margin-bottom: 14px;">
    <p style="text-align: center;margin: 14px 0">
        <em>Next-generation Markdown editor, built for the future</em>
    </p>
    <div style="display: flex;margin-bottom: 14px;flex-wrap: wrap;align-items: center">
        <img src="https://unpkg.com/vditor/dist/images/logo.png" style="margin: 0 auto;height: 68px"/>
        <div>&nbsp;&nbsp;</div>
        <div style="flex: 1;min-width: 250px">
            Vditor is a browser-based Markdown editor that supports WYSIWYG, instant rendering (similar to Typora), and split preview modes.
            It is implemented in TypeScript and supports plain JavaScript as well as frameworks like Vue, React, Angular, and Svelte.
        </div>
    </div>
    <div style="display: flex;flex-wrap: wrap;">
        <ul style="list-style: none;flex: 1;min-width:148px">
            <li>
            Project: <a href="https://b3log.org/vditor" target="_blank">b3log.org/vditor</a>
            </li>
            <li>
            License: MIT
            </li>
        </ul>
        <ul style="list-style: none;margin-right: 18px">
            <li>
            Component versions: Vditor v${VDITOR_VERSION} / Lute v${Lute.Version}
            </li>
            <li>
            Sponsorship: <a href="https://ld246.com/sponsor" target="_blank">https://ld246.com/sponsor</a>
            </li>
        </ul>
    </div>
    </div>`, 0);
        });
    }
}
