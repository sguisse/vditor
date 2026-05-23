import {Constants} from "../constants";
import {input as IRInput} from "../ir/input";
import {processAfterRender} from "../ir/process";
import {processAfterRender as processSVAfterRender, processPaste} from "../sv/process";
import {uploadFiles} from "../upload/index";
import {setHeaders} from "../upload/setHeaders";
import {afterRenderEvent} from "../wysiwyg/afterRenderEvent";
import {input} from "../wysiwyg/input";
import {isCtrl, isFirefox} from "./compatibility";
import {scrollCenter} from "./editorCommonEvent";
import {
    getTopList,
    hasClosestBlock,
    hasClosestByAttribute,
    hasClosestByClassName,
    hasClosestByMatchTag,
} from "./hasClosest";
import {getLastNode} from "./hasClosest";
import {highlightToolbar} from "./highlightToolbar";
import {matchHotKey} from "./hotKey";
import {processCodeRender, processPasteCode} from "./processCode";
import {
    getEditorRange,
    getSelectPosition,
    insertHTML,
    setRangeByWbr,
    setSelectionByPosition, setSelectionFocus,
} from "./selection";

// https://github.com/Vanessa219/vditor/issues/508 Soft keyboard cannot delete empty blocks
export const fixGSKeyBackspace = (event: KeyboardEvent, vditor: IVditor, startContainer: Node) => {
    if (event.keyCode === 229 && event.code === "" && event.key === "Unidentified" && vditor.currentMode !== "sv") {
        const blockElement = hasClosestBlock(startContainer);
        // On mobile punctuation keys report keyCode 299, so require truly empty blocks for deletion
        if (blockElement && blockElement.textContent.trim() === "") {
            vditor[vditor.currentMode].composingLock = true;
            return false;
        }
    }
    return true;
};

// https://github.com/Vanessa219/vditor/issues/361 Chinese input after code block
export const fixCJKPosition = (range: Range, vditor: IVditor, event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === "Tab" || event.key === "Backspace" || event.key.indexOf("Arrow") > -1
        || isCtrl(event) || event.key === "Escape" || event.shiftKey || event.altKey) {
        return;
    }
    const pLiElement = hasClosestByMatchTag(range.startContainer, "P") ||
        hasClosestByMatchTag(range.startContainer, "LI");
    if (pLiElement && getSelectPosition(pLiElement, vditor[vditor.currentMode].element, range).start === 0) {

        // https://github.com/Vanessa219/vditor/issues/1289 WKWebView IME switch inserts U+2006 (six-per-em space), causing caret misalignment
        if (pLiElement.nodeValue) {
            pLiElement.nodeValue = pLiElement.nodeValue.replace(/\u2006/g, "");
        }

        const zwspNode = document.createTextNode(Constants.ZWSP);
        range.insertNode(zwspNode);
        range.setStartAfter(zwspNode);
    }
};

// https://github.com/Vanessa219/vditor/issues/381 Caret cannot move down inside inline math/html entities
export const fixCursorDownInlineMath = (range: Range, key: string) => {
    if (key === "ArrowDown" || key === "ArrowUp") {
        const inlineElement = hasClosestByAttribute(range.startContainer, "data-type", "math-inline") ||
            hasClosestByAttribute(range.startContainer, "data-type", "html-entity") ||
            hasClosestByAttribute(range.startContainer, "data-type", "html-inline");
        if (inlineElement) {
            if (key === "ArrowDown") {
                range.setStartAfter(inlineElement.parentElement);
            }
            if (key === "ArrowUp") {
                range.setStartBefore(inlineElement.parentElement);
            }
        }
    }
};

export const insertEmptyBlock = (vditor: IVditor, position: InsertPosition) => {
    const range = getEditorRange(vditor);
    const blockElement = hasClosestBlock(range.startContainer);
    if (blockElement) {
        blockElement.insertAdjacentHTML(position, `<p data-block="0">${Constants.ZWSP}<wbr>\n</p>`);
        setRangeByWbr(vditor[vditor.currentMode].element, range);
        highlightToolbar(vditor);
        execAfterRender(vditor);
    }
};

export const isFirstCell = (cellElement: HTMLElement) => {
    const tableElement = hasClosestByMatchTag(cellElement, "TABLE") as HTMLTableElement;
    if (tableElement && tableElement.rows[0].cells[0].isSameNode(cellElement)) {
        return tableElement;
    }
    return false;
};

export const isLastCell = (cellElement: HTMLElement) => {
    const tableElement = hasClosestByMatchTag(cellElement, "TABLE") as HTMLTableElement;
    if (tableElement && tableElement.lastElementChild.lastElementChild.lastElementChild.isSameNode(cellElement)) {
        return tableElement;
    }
    return false;
};

// Move caret to the previous table cell
const goPreviousCell = (cellElement: HTMLElement, range: Range, isSelected = true) => {
    let previousElement = cellElement.previousElementSibling;
    if (!previousElement) {
        if (cellElement.parentElement.previousElementSibling) {
            previousElement = cellElement.parentElement.previousElementSibling.lastElementChild;
        } else if (cellElement.parentElement.parentElement.tagName === "TBODY" &&
            cellElement.parentElement.parentElement.previousElementSibling) {
            previousElement = cellElement.parentElement
                .parentElement.previousElementSibling.lastElementChild.lastElementChild;
        } else {
            previousElement = null;
        }
    }
    if (previousElement) {
        range.selectNodeContents(previousElement);
        if (!isSelected) {
            range.collapse(false);
        }
        setSelectionFocus(range);
    }
    return previousElement;
};

export const insertAfterBlock = (vditor: IVditor, event: KeyboardEvent, range: Range, element: HTMLElement,
                                 blockElement: HTMLElement) => {
    const position = getSelectPosition(element, vditor[vditor.currentMode].element, range);
    if ((event.key === "ArrowDown" && element.textContent.trimRight().substr(position.start).indexOf("\n") === -1) ||
        (event.key === "ArrowRight" && position.start >= element.textContent.trimRight().length)) {
        const nextElement = blockElement.nextElementSibling;
        if (!nextElement ||
            (nextElement && (nextElement.tagName === "TABLE" || nextElement.getAttribute("data-type")))) {
            blockElement.insertAdjacentHTML("afterend",
                `<p data-block="0">${Constants.ZWSP}<wbr></p>`);
            setRangeByWbr(vditor[vditor.currentMode].element, range);
        } else {
            range.selectNodeContents(nextElement);
            range.collapse(true);
            setSelectionFocus(range);
        }
        event.preventDefault();
        return true;
    }
    return false;
};

export const insertBeforeBlock = (vditor: IVditor, event: KeyboardEvent, range: Range, element: HTMLElement,
                                  blockElement: HTMLElement) => {
    const position = getSelectPosition(element, vditor[vditor.currentMode].element, range);
    if ((event.key === "ArrowUp" && element.textContent.substr(0, position.start).indexOf("\n") === -1) ||
        ((event.key === "ArrowLeft" || (event.key === "Backspace" && range.toString() === "")) &&
            position.start === 0)) {
        const previousElement = blockElement.previousElementSibling;
        // table || code
        if (!previousElement ||
            (previousElement && (previousElement.tagName === "TABLE" || previousElement.getAttribute("data-type")))) {
            blockElement.insertAdjacentHTML("beforebegin",
                `<p data-block="0">${Constants.ZWSP}<wbr></p>`);
            setRangeByWbr(vditor[vditor.currentMode].element, range);
        } else {
            range.selectNodeContents(previousElement);
            range.collapse(false);
            setSelectionFocus(range);
        }
        event.preventDefault();
        return true;
    }
    return false;
};

export const listToggle = (vditor: IVditor, range: Range, type: string, cancel = true) => {
    const itemElement = hasClosestByMatchTag(range.startContainer, "LI");
    vditor[vditor.currentMode].element.querySelectorAll("wbr").forEach((wbr) => {
        wbr.remove();
    });
    range.insertNode(document.createElement("wbr"));

    if (cancel && itemElement) {
        // cancel
        let pHTML = "";
        for (let i = 0; i < itemElement.parentElement.childElementCount; i++) {
            const inputElement = itemElement.parentElement.children[i].querySelector("input");
            if (inputElement) {
                inputElement.remove();
            }
            pHTML += `<p data-block="0">${itemElement.parentElement.children[i].innerHTML.trimLeft()}</p>`;
        }
        itemElement.parentElement.insertAdjacentHTML("beforebegin", pHTML);
        itemElement.parentElement.remove();
        } else {
            if (!itemElement) {
                // add
            let blockElement = hasClosestByAttribute(range.startContainer, "data-block", "0");
            if (!blockElement) {
                vditor[vditor.currentMode].element.querySelector("wbr").remove();
                blockElement = vditor[vditor.currentMode].element.querySelector("p");
                blockElement.innerHTML = "<wbr>";
            }
            if (type === "check") {
                blockElement.insertAdjacentHTML("beforebegin",
                    `<ul data-block="0"><li class="vditor-task"><input type="checkbox" /> ${blockElement.innerHTML}</li></ul>`);
                blockElement.remove();
            } else if (type === "list") {
                blockElement.insertAdjacentHTML("beforebegin",
                    `<ul data-block="0"><li>${blockElement.innerHTML}</li></ul>`);
                blockElement.remove();
            } else if (type === "ordered-list") {
                blockElement.insertAdjacentHTML("beforebegin",
                    `<ol data-block="0"><li>${blockElement.innerHTML}</li></ol>`);
                blockElement.remove();
            }
        } else {
            // toggle
            if (type === "check") {
                itemElement.parentElement.querySelectorAll("li").forEach((item) => {
                    item.insertAdjacentHTML("afterbegin",
                        `<input type="checkbox" />${item.textContent.indexOf(" ") === 0 ? "" : " "}`);
                    item.classList.add("vditor-task");
                });
            } else {
                if (itemElement.querySelector("input")) {
                    itemElement.parentElement.querySelectorAll("li").forEach((item) => {
                        item.querySelector("input").remove();
                        item.classList.remove("vditor-task");
                    });
                }
                let element;
                if (type === "list") {
                    element = document.createElement("ul");
                    element.setAttribute("data-marker", "*");
                } else {
                    element = document.createElement("ol");
                    element.setAttribute("data-marker", "1.");
                }
                element.setAttribute("data-block", "0");
                element.setAttribute("data-tight", itemElement.parentElement.getAttribute("data-tight"));
                element.innerHTML = itemElement.parentElement.innerHTML;
                itemElement.parentElement.parentNode.replaceChild(element, itemElement.parentElement);
            }
        }
    }
};

export const listIndent = (vditor: IVditor, liElement: HTMLElement, range: Range) => {
    const previousElement = liElement.previousElementSibling;
    if (liElement && previousElement) {
        const liElements: HTMLElement[] = [liElement];
        Array.from(range.cloneContents().children).forEach((item, index) => {
            if (item.nodeType !== 3 && liElement && item.textContent.trim() !== ""
                && liElement.getAttribute("data-node-id") === item.getAttribute("data-node-id")) {
                if (index !== 0) {
                    liElements.push(liElement);
                }
                liElement = liElement.nextElementSibling as HTMLElement;
            }
        });

        vditor[vditor.currentMode].element.querySelectorAll("wbr").forEach((wbr) => {
            wbr.remove();
        });
        range.insertNode(document.createElement("wbr"));
        const liParentElement = previousElement.parentElement;

        let liHTML = "";
        liElements.forEach((item: HTMLElement) => {
            let marker = item.getAttribute("data-marker");
            if (marker.length !== 1) {
                marker = `1${marker.slice(-1)}`;
            }
            liHTML += `<li data-node-id="${item.getAttribute("data-node-id")}" data-marker="${marker}">${item.innerHTML}</li>`;
            item.remove();
        });
        previousElement.insertAdjacentHTML("beforeend",
            `<${liParentElement.tagName} data-block="0">${liHTML}</${liParentElement.tagName}>`);

        if (vditor.currentMode === "wysiwyg") {
            liParentElement.outerHTML = vditor.lute.SpinVditorDOM(liParentElement.outerHTML);
        } else {
            liParentElement.outerHTML = vditor.lute.SpinVditorIRDOM(liParentElement.outerHTML);
        }

        setRangeByWbr(vditor[vditor.currentMode].element, range);
        const tempTopListElement = getTopList(range.startContainer);
        if (tempTopListElement) {
            tempTopListElement.querySelectorAll(`.vditor-${vditor.currentMode}__preview[data-render='2']`)
                .forEach((item: HTMLElement) => {
                    processCodeRender(item, vditor);
                    if (vditor.currentMode === "wysiwyg") {
                        item.previousElementSibling.setAttribute("style", "display:none");
                    }
                });
        }
        execAfterRender(vditor);
        highlightToolbar(vditor);
    } else {
        vditor[vditor.currentMode].element.focus();
    }
};

export const listOutdent = (vditor: IVditor, liElement: HTMLElement, range: Range, topListElement: HTMLElement) => {
    const liParentLiElement = hasClosestByMatchTag(liElement.parentElement, "LI");
    if (liParentLiElement) {
        vditor[vditor.currentMode].element.querySelectorAll("wbr").forEach((wbr) => {
            wbr.remove();
        });
        range.insertNode(document.createElement("wbr"));

        const liParentElement = liElement.parentElement;
        const liParentAfterElement = liParentElement.cloneNode() as HTMLElement;
        const liElements: HTMLElement[] = [liElement];
        Array.from(range.cloneContents().children).forEach((item, index) => {
            if (item.nodeType !== 3 && liElement && item.textContent.trim() !== "" &&
                liElement.getAttribute("data-node-id") === item.getAttribute("data-node-id")) {
                if (index !== 0) {
                    liElements.push(liElement);
                }
                liElement = liElement.nextElementSibling as HTMLElement;
            }
        });
        let isMatch = false;
        let afterHTML = "";
        liParentElement.querySelectorAll("li").forEach((item) => {
            if (isMatch) {
                afterHTML += item.outerHTML;
                if (!item.nextElementSibling && !item.previousElementSibling) {
                    item.parentElement.remove();
                } else {
                    item.remove();
                }
            }
            if (item.isSameNode(liElements[liElements.length - 1])) {
                isMatch = true;
            }
        });

        liElements.reverse().forEach((item) => {
            liParentLiElement.insertAdjacentElement("afterend", item);
        });

        if (afterHTML) {
            liParentAfterElement.innerHTML = afterHTML;
            liElements[0].insertAdjacentElement("beforeend", liParentAfterElement);
        }

        if (vditor.currentMode === "wysiwyg") {
            topListElement.outerHTML = vditor.lute.SpinVditorDOM(topListElement.outerHTML);
        } else {
            topListElement.outerHTML = vditor.lute.SpinVditorIRDOM(topListElement.outerHTML);
        }

        setRangeByWbr(vditor[vditor.currentMode].element, range);
        const tempTopListElement = getTopList(range.startContainer);
        if (tempTopListElement) {
            tempTopListElement.querySelectorAll(`.vditor-${vditor.currentMode}__preview[data-render='2']`)
                .forEach((item: HTMLElement) => {
                    processCodeRender(item, vditor);
                    if (vditor.currentMode === "wysiwyg") {
                        item.previousElementSibling.setAttribute("style", "display:none");
                    }
                });
        }
        execAfterRender(vditor);
        highlightToolbar(vditor);
    } else {
        vditor[vditor.currentMode].element.focus();
    }
};

export const setTableAlign = (tableElement: HTMLTableElement, type: string) => {
    const cell = getSelection().getRangeAt(0).startContainer.parentElement;

    const columnCnt = tableElement.rows[0].cells.length;
    const rowCnt = tableElement.rows.length;
    let currentColumn = 0;

    for (let i = 0; i < rowCnt; i++) {
        for (let j = 0; j < columnCnt; j++) {
            if (tableElement.rows[i].cells[j].isSameNode(cell)) {
                currentColumn = j;
                break;
            }
        }
    }
    for (let k = 0; k < rowCnt; k++) {
        tableElement.rows[k].cells[currentColumn].setAttribute("align", type);
    }
};

export const isHrMD = (text: string) => {
    // - _ *
    const marker = text.trimRight().split("\n").pop();
    if (marker === "") {
        return false;
    }
    if (marker.replace(/ |-/g, "") === ""
        || marker.replace(/ |_/g, "") === ""
        || marker.replace(/ |\*/g, "") === "") {
        if (marker.replace(/ /g, "").length > 2) {
            if (marker.indexOf("-") > -1 && marker.trimLeft().indexOf(" ") === -1
                && text.trimRight().split("\n").length > 1) {
                // matches a heading
                return false;
            }
            if (marker.indexOf("    ") === 0 || marker.indexOf("\t") === 0) {
                // code block
                return false;
            }
            return true;
        }
        return false;
    }
    return false;
};

export const isHeadingMD = (text: string) => {
    // - =
    const textArray = text.trimRight().split("\n");
    text = textArray.pop();

    if (text.indexOf("    ") === 0 || text.indexOf("\t") === 0) {
        return false;
    }

    text = text.trimLeft();
    if (text === "" || textArray.length === 0) {
        return false;
    }
    if (text.replace(/-/g, "") === ""
        || text.replace(/=/g, "") === "") {
        return true;
    }
    return false;
};

export const execAfterRender = (vditor: IVditor, options = {
    enableAddUndoStack: true,
    enableHint: false,
    enableInput: true,
}) => {
    if (vditor.currentMode === "wysiwyg") {
        afterRenderEvent(vditor, options);
    } else if (vditor.currentMode === "ir") {
        processAfterRender(vditor, options);
    } else if (vditor.currentMode === "sv") {
        processSVAfterRender(vditor, options);
    }
};

export const fixList = (range: Range, vditor: IVditor, pElement: HTMLElement | false, event: KeyboardEvent) => {
    const startContainer = range.startContainer;
    const liElement = hasClosestByMatchTag(startContainer, "LI");
    if (liElement) {
        if (!isCtrl(event) && !event.altKey && event.key === "Enter" &&
            // When an li contains multiple <p>, pressing Enter in the first <p> may create a new li below
            (!event.shiftKey && pElement && liElement.contains(pElement) && pElement.nextElementSibling)) {
            if (liElement && !liElement.textContent.endsWith("\n")) {
                // li must end with \n
                liElement.insertAdjacentText("beforeend", "\n");
            }
            range.insertNode(document.createTextNode("\n\n"));
            range.collapse(false);
            execAfterRender(vditor);
            event.preventDefault();
            return true;
        }

        if (!isCtrl(event) && !event.shiftKey && !event.altKey && event.key === "Backspace" &&
            !liElement.previousElementSibling && range.toString() === "" &&
            getSelectPosition(liElement, vditor[vditor.currentMode].element, range).start === 0) {
            // Cannot delete li when caret is between the list marker and the first character
            if (liElement.nextElementSibling) {
                liElement.parentElement.insertAdjacentHTML("beforebegin",
                    `<p data-block="0"><wbr>${liElement.innerHTML}</p>`);
                liElement.remove();
            } else {
                liElement.parentElement.outerHTML = `<p data-block="0"><wbr>${liElement.innerHTML}</p>`;
            }
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            event.preventDefault();
            return true;
        }

        // Align with the previous paragraph after removing an empty list
        if (!isCtrl(event) && !event.shiftKey && !event.altKey && event.key === "Backspace" &&
            liElement.textContent.trim().replace(Constants.ZWSP, "") === "" &&
            range.toString() === "" && liElement.previousElementSibling?.tagName === "LI") {
            liElement.previousElementSibling.insertAdjacentText("beforeend", "\n\n");
            range.selectNodeContents(liElement.previousElementSibling);
            range.collapse(false);
            liElement.remove();
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            event.preventDefault();
            return true;
        }

        if (!isCtrl(event) && !event.altKey && event.key === "Tab") {
            // When caret is at the first/zero character, Tab is used to indent list items
            let isFirst = false;
            if (range.startOffset === 0
                && ((startContainer.nodeType === 3 && !startContainer.previousSibling)
                    || (startContainer.nodeType !== 3 && startContainer.nodeName === "LI"))) {
                // ordered/unordered list
                isFirst = true;
            } else if (liElement.classList.contains("vditor-task") && range.startOffset === 1
                && startContainer.previousSibling.nodeType !== 3
                && (startContainer.previousSibling as HTMLElement).tagName === "INPUT") {
                // task list
                isFirst = true;
            }

            if (isFirst || range.toString() !== "") {
                if (event.shiftKey) {
                    listOutdent(vditor, liElement, range, liElement.parentElement);
                } else {
                    listIndent(vditor, liElement, range);
                }
                event.preventDefault();
                return true;
            }
        }
    }
    return false;
};

// Tab handling: block code render, table. Tab handling for the first character in a list is implemented above
export const fixTab = (vditor: IVditor, range: Range, event: KeyboardEvent) => {
    if (vditor.options.tab && event.key === "Tab") {
        if (event.shiftKey) {
            // TODO shift+tab
        } else {
            if (range.toString() === "") {
                range.insertNode(document.createTextNode(vditor.options.tab));
                range.collapse(false);
            } else {
                range.extractContents();
                range.insertNode(document.createTextNode(vditor.options.tab));
                range.collapse(false);
            }
        }
        setSelectionFocus(range);
        execAfterRender(vditor);
        event.preventDefault();
        return true;
    }
};

export const fixMarkdown = (event: KeyboardEvent, vditor: IVditor, pElement: HTMLElement | false, range: Range) => {
    if (!pElement) {
        return;
    }
    if (!isCtrl(event) && !event.altKey && event.key === "Enter") {
        const pText = String.raw`${pElement.textContent}`.replace(/\\\|/g, "").trim();
        const pTextList = pText.split("|");
        if (pText.startsWith("|") && pText.endsWith("|") && pTextList.length > 3) {
            // Table auto-complete
            let tableHeaderMD = pTextList.map(() => "---").join("|");
            tableHeaderMD =
                pElement.textContent + "\n" + tableHeaderMD.substring(3, tableHeaderMD.length - 3) + "\n|<wbr>";
            pElement.outerHTML = vditor.lute.SpinVditorDOM(tableHeaderMD);
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            scrollCenter(vditor);
            event.preventDefault();
            return true;
        }

        // HR rendering
        if (isHrMD(pElement.innerHTML) && pElement.previousElementSibling) {
            // If there are soft line-breaks, there may be content before the HR
            let pInnerHTML = "";
            const innerHTMLList = pElement.innerHTML.trimRight().split("\n");
            if (innerHTMLList.length > 1) {
                innerHTMLList.pop();
                pInnerHTML = `<p data-block="0">${innerHTMLList.join("\n")}</p>`;
            }

            pElement.insertAdjacentHTML("afterend",
                `${pInnerHTML}<hr data-block="0"><p data-block="0"><wbr>\n</p>`);
            pElement.remove();
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            scrollCenter(vditor);
            event.preventDefault();
            return true;
        }

        if (isHeadingMD(pElement.innerHTML)) {
            // Heading rendering
            if (vditor.currentMode === "wysiwyg") {
                pElement.outerHTML = vditor.lute.SpinVditorDOM(pElement.innerHTML + '<p data-block="0"><wbr>\n</p>');
            } else {
                pElement.outerHTML = vditor.lute.SpinVditorIRDOM(pElement.innerHTML + '<p data-block="0"><wbr>\n</p>');
            }
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            scrollCenter(vditor);
            event.preventDefault();
            return true;
        }
    }

    // Soft line-breaks may be split https://github.com/Vanessa219/vditor/issues/220
    if (range.collapsed && pElement.previousElementSibling && event.key === "Backspace" &&
        !isCtrl(event) && !event.altKey && !event.shiftKey &&
        pElement.textContent.trimRight().split("\n").length > 1 &&
        getSelectPosition(pElement, vditor[vditor.currentMode].element, range).start === 0) {
        const lastElement = getLastNode(pElement.previousElementSibling) as HTMLElement;
        if (!lastElement.textContent.endsWith("\n")) {
            lastElement.textContent = lastElement.textContent + "\n";
        }
        lastElement.parentElement.insertAdjacentHTML("beforeend", `<wbr>${pElement.innerHTML}`);
        pElement.remove();
        setRangeByWbr(vditor[vditor.currentMode].element, range);
        return false;
    }
    return false;
};

export const insertRow = (vditor: IVditor, range: Range, cellElement: HTMLElement) => {
    let rowHTML = "";
    for (let m = 0; m < cellElement.parentElement.childElementCount; m++) {
        rowHTML += `<td align="${cellElement.parentElement.children[m].getAttribute("align")}"> </td>`;
    }
    if (cellElement.tagName === "TH") {
        cellElement.parentElement.parentElement.insertAdjacentHTML("afterend",
            `<tbody><tr>${rowHTML}</tr></tbody>`);
    } else {
        cellElement.parentElement.insertAdjacentHTML("afterend", `<tr>${rowHTML}</tr>`);
    }
    execAfterRender(vditor);
};

export const insertRowAbove = (vditor: IVditor, range: Range, cellElement: HTMLElement) => {
    let rowHTML = "";
    for (let m = 0; m < cellElement.parentElement.childElementCount; m++) {
        if (cellElement.tagName === "TH") {
            rowHTML += `<th align="${cellElement.parentElement.children[m].getAttribute("align")}"> </th>`;
        } else {
            rowHTML += `<td align="${cellElement.parentElement.children[m].getAttribute("align")}"> </td>`;
        }
    }
    if (cellElement.tagName === "TH") {
        cellElement.parentElement.parentElement.insertAdjacentHTML("beforebegin", `<thead><tr>${rowHTML}</tr></thead>`);

        range.insertNode(document.createElement("wbr"));
        const theadHTML = cellElement.parentElement.innerHTML.replace(/<th>/g, "<td>").replace(/<\/th>/g, "</td>");
        cellElement.parentElement.parentElement.nextElementSibling.insertAdjacentHTML("afterbegin", theadHTML);

        cellElement.parentElement.parentElement.remove();
        setRangeByWbr(vditor.ir.element, range);
    } else {
        cellElement.parentElement.insertAdjacentHTML("beforebegin", `<tr>${rowHTML}</tr>`);
    }
    execAfterRender(vditor);
};

export const insertColumn =
    (vditor: IVditor, tableElement: HTMLTableElement, cellElement: HTMLElement, type: InsertPosition = "afterend") => {
        let index = 0;
        let previousElement = cellElement.previousElementSibling;
        while (previousElement) {
            index++;
            previousElement = previousElement.previousElementSibling;
        }
        for (let i = 0; i < tableElement.rows.length; i++) {
            if (i === 0) {
                tableElement.rows[i].cells[index].insertAdjacentHTML(type, "<th> </th>");
            } else {
                tableElement.rows[i].cells[index].insertAdjacentHTML(type, "<td> </td>");
            }
        }
        execAfterRender(vditor);
    };
export const deleteRow = (vditor: IVditor, range: Range, cellElement: HTMLElement) => {
    if (cellElement.tagName === "TD") {
        const tbodyElement = cellElement.parentElement.parentElement;
        if (cellElement.parentElement.previousElementSibling) {
            range.selectNodeContents(cellElement.parentElement.previousElementSibling.lastElementChild);
        } else {
            range.selectNodeContents(tbodyElement.previousElementSibling.lastElementChild.lastElementChild);
        }

        if (tbodyElement.childElementCount === 1) {
            tbodyElement.remove();
        } else {
            cellElement.parentElement.remove();
        }

        range.collapse(false);
        setSelectionFocus(range);
        execAfterRender(vditor);
    }
};

export const deleteColumn =
    (vditor: IVditor, range: Range, tableElement: HTMLTableElement, cellElement: HTMLElement) => {
        let index = 0;
        let previousElement = cellElement.previousElementSibling;
        while (previousElement) {
            index++;
            previousElement = previousElement.previousElementSibling;
        }
        if (cellElement.previousElementSibling || cellElement.nextElementSibling) {
            range.selectNodeContents(cellElement.previousElementSibling || cellElement.nextElementSibling);
            range.collapse(true);
        }
        for (let i = 0; i < tableElement.rows.length; i++) {
            const cells = tableElement.rows[i].cells;
            if (cells.length === 1) {
                tableElement.remove();
                highlightToolbar(vditor);
                break;
            }
            cells[index].remove();
        }
        setSelectionFocus(range);
        execAfterRender(vditor);
    };

export const fixTable = (vditor: IVditor, event: KeyboardEvent, range: Range) => {
    const startContainer = range.startContainer;
    const cellElement = hasClosestByMatchTag(startContainer, "TD") ||
        hasClosestByMatchTag(startContainer, "TH");
    if (cellElement) {
        // Enter or soft line-break: add <br> inside the cell
        if (!isCtrl(event) && !event.altKey && event.key === "Enter") {
            if (!cellElement.lastElementChild ||
                (cellElement.lastElementChild && (!cellElement.lastElementChild.isSameNode(cellElement.lastChild) ||
                    cellElement.lastElementChild.tagName !== "BR"))) {
                cellElement.insertAdjacentHTML("beforeend", "<br>");
            }
            const brElement = document.createElement("br");
            range.insertNode(brElement);
            range.setStartAfter(brElement);
            execAfterRender(vditor);
            scrollCenter(vditor);
            event.preventDefault();
            return true;
        }

        // Tab: move caret to the next cell
        if (event.key === "Tab") {
            if (event.shiftKey) {
                // Shift+Tab: move caret to the previous cell
                goPreviousCell(cellElement, range);
                event.preventDefault();
                return true;
            }

            let nextElement = cellElement.nextElementSibling;
            if (!nextElement) {
                if (cellElement.parentElement.nextElementSibling) {
                    nextElement = cellElement.parentElement.nextElementSibling.firstElementChild;
                } else if (cellElement.parentElement.parentElement.tagName === "THEAD" &&
                    cellElement.parentElement.parentElement.nextElementSibling) {
                    nextElement =
                        cellElement.parentElement.parentElement.nextElementSibling.firstElementChild.firstElementChild;
                } else {
                    nextElement = null;
                }
            }
            if (nextElement) {
                range.selectNodeContents(nextElement);
                setSelectionFocus(range);
            }
            event.preventDefault();
            return true;
        }

        const tableElement = cellElement.parentElement.parentElement.parentElement as HTMLTableElement;
        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (cellElement.tagName === "TH") {
                if (tableElement.previousElementSibling) {
                    range.selectNodeContents(tableElement.previousElementSibling);
                    range.collapse(false);
                    setSelectionFocus(range);
                } else {
                    insertEmptyBlock(vditor, "beforebegin");
                }
                return true;
            }

            let m = 0;
            const trElement = cellElement.parentElement as HTMLTableRowElement;
            for (; m < trElement.cells.length; m++) {
                if (trElement.cells[m].isSameNode(cellElement)) {
                    break;
                }
            }

            let previousElement = trElement.previousElementSibling as HTMLTableRowElement;
            if (!previousElement) {
                previousElement = trElement.parentElement.previousElementSibling.firstChild as HTMLTableRowElement;
            }
            range.selectNodeContents(previousElement.cells[m]);
            range.collapse(false);
            setSelectionFocus(range);
            return true;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            const trElement = cellElement.parentElement as HTMLTableRowElement;
            if (!trElement.nextElementSibling && cellElement.tagName === "TD") {
                if (tableElement.nextElementSibling) {
                    range.selectNodeContents(tableElement.nextElementSibling);
                    range.collapse(true);
                    setSelectionFocus(range);
                } else {
                    insertEmptyBlock(vditor, "afterend");
                }
                return true;
            }

            let m = 0;
            for (; m < trElement.cells.length; m++) {
                if (trElement.cells[m].isSameNode(cellElement)) {
                    break;
                }
            }

            let nextElement = trElement.nextElementSibling as HTMLTableRowElement;
            if (!nextElement) {
                nextElement = trElement.parentElement.nextElementSibling.firstChild as HTMLTableRowElement;
            }
            range.selectNodeContents(nextElement.cells[m]);
            range.collapse(true);
            setSelectionFocus(range);
            return true;
        }

        // focus row input, only wysiwyg
        if (vditor.currentMode === "wysiwyg" &&
            !isCtrl(event) && event.key === "Enter" && !event.shiftKey && event.altKey) {
            const inputElement = (vditor.wysiwyg.popover.querySelector(".vditor-input") as HTMLInputElement);
            inputElement.focus();
            inputElement.select();
            event.preventDefault();
            return true;
        }

        // Backspace: move caret to the previous cell
        if (!isCtrl(event) && !event.shiftKey && !event.altKey && event.key === "Backspace"
            && range.startOffset === 0 && range.toString() === "") {
            const previousCellElement = goPreviousCell(cellElement, range, false);
            if (!previousCellElement && tableElement) {
                if (tableElement.textContent.trim() === "") {
                    tableElement.outerHTML = `<p data-block="0"><wbr>\n</p>`;
                    setRangeByWbr(vditor[vditor.currentMode].element, range);
                } else {
                    range.setStartBefore(tableElement);
                    range.collapse(true);
                }
                execAfterRender(vditor);
            }
            event.preventDefault();
            return true;
        }
        // Insert a new row above
        if (matchHotKey("⇧⌘F", event)) {
            insertRowAbove(vditor, range, cellElement);
            event.preventDefault();
            return true;
        }

        // Insert a new row below https://github.com/Vanessa219/vditor/issues/46
        if (matchHotKey("⌘=", event)) {
            insertRow(vditor, range, cellElement);
            event.preventDefault();
            return true;
        }

        // Insert a new column to the left
        if (matchHotKey("⇧⌘G", event)) {
            insertColumn(vditor, tableElement, cellElement, "beforebegin");
            event.preventDefault();
            return true;
        }

        // Insert a new column to the right
        if (matchHotKey("⇧⌘=", event)) {
            insertColumn(vditor, tableElement, cellElement);
            event.preventDefault();
            return true;
        }

        // Delete the current row
        if (matchHotKey("⌘-", event)) {
            deleteRow(vditor, range, cellElement);
            event.preventDefault();
            return true;
        }

        // Delete the current column
        if (matchHotKey("⇧⌘-", event)) {
            deleteColumn(vditor, range, tableElement, cellElement);
            event.preventDefault();
            return true;
        }

        // Align left
        if (matchHotKey("⇧⌘L", event)) {
            if (vditor.currentMode === "ir") {
                setTableAlign(tableElement, "left");
                execAfterRender(vditor);
                event.preventDefault();
                return true;
            } else {
                const itemElement: HTMLElement = vditor.wysiwyg.popover.querySelector('[data-type="left"]');
                if (itemElement) {
                    itemElement.click();
                    event.preventDefault();
                    return true;
                }
            }
        }

        // Align center
        if (matchHotKey("⇧⌘C", event)) {
            if (vditor.currentMode === "ir") {
                setTableAlign(tableElement, "center");
                execAfterRender(vditor);
                event.preventDefault();
                return true;
            } else {
                const itemElement: HTMLElement = vditor.wysiwyg.popover.querySelector('[data-type="center"]');
                if (itemElement) {
                    itemElement.click();
                    event.preventDefault();
                    return true;
                }
            }
        }
        // Align right
        if (matchHotKey("⇧⌘R", event)) {
            if (vditor.currentMode === "ir") {
                setTableAlign(tableElement, "right");
                execAfterRender(vditor);
                event.preventDefault();
                return true;
            } else {
                const itemElement: HTMLElement = vditor.wysiwyg.popover.querySelector('[data-type="right"]');
                if (itemElement) {
                    itemElement.click();
                    event.preventDefault();
                    return true;
                }
            }
        }
    }
    return false;
};

export const fixCodeBlock = (vditor: IVditor, event: KeyboardEvent, codeRenderElement: HTMLElement, range: Range) => {
    // For code block (PRE), Cmd+A selects the block content
    if (codeRenderElement.tagName === "PRE" && matchHotKey("⌘A", event)) {
        range.selectNodeContents(codeRenderElement.firstElementChild);
        event.preventDefault();
        return true;
    }

    // Tab handling inside code block
    // TODO: handle shift+Tab and selected text
    if (vditor.options.tab && event.key === "Tab" && !event.shiftKey && range.toString() === "") {
        range.insertNode(document.createTextNode(vditor.options.tab));
        range.collapse(false);
        execAfterRender(vditor);
        event.preventDefault();
        return true;
    }

    // Backspace: when caret is at the first character, only remove the code block wrapper
    if (event.key === "Backspace" && !isCtrl(event) && !event.shiftKey && !event.altKey) {
        const codePosition = getSelectPosition(codeRenderElement, vditor[vditor.currentMode].element, range);
        if ((codePosition.start === 0 ||
                (codePosition.start === 1 && codeRenderElement.innerText === "\n")) // Empty code block — caret is after "\\n"
            && range.toString() === "") {
            codeRenderElement.parentElement.outerHTML =
                `<p data-block="0"><wbr>${codeRenderElement.firstElementChild.innerHTML}</p>`;
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            event.preventDefault();
            return true;
        }
    }

    // Newline
    if (!isCtrl(event) && !event.altKey && event.key === "Enter") {
        if (!codeRenderElement.firstElementChild.textContent.endsWith("\n")) {
            codeRenderElement.firstElementChild.insertAdjacentText("beforeend", "\n");
        }
        range.extractContents();
        range.insertNode(document.createTextNode("\n"));
        range.collapse(false);
        setSelectionFocus(range);
        if (!isFirefox()) {
            if (vditor.currentMode === "wysiwyg") {
                input(vditor, range);
            } else {
                IRInput(vditor, range);
            }
        }
        scrollCenter(vditor);
        event.preventDefault();
        return true;
    }
    return false;
};

export const fixBlockquote = (vditor: IVditor, range: Range, event: KeyboardEvent, pElement: HTMLElement | false) => {
    const startContainer = range.startContainer;
    const blockquoteElement = hasClosestByMatchTag(startContainer, "BLOCKQUOTE");
    if (blockquoteElement && range.toString() === "") {
            if (event.key === "Backspace" && !isCtrl(event) && !event.shiftKey && !event.altKey &&
            getSelectPosition(blockquoteElement, vditor[vditor.currentMode].element, range).start === 0) {
            // Backspace: caret is at the first character inside blockquote; only remove the blockquote marker
            range.insertNode(document.createElement("wbr"));
            blockquoteElement.outerHTML = blockquoteElement.innerHTML;
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            event.preventDefault();
            return true;
        }

            if (pElement && event.key === "Enter" && !isCtrl(event) && !event.shiftKey && !event.altKey
            && pElement.parentElement.tagName === "BLOCKQUOTE") {
            // Enter: pressing Enter on an empty line should unnest one level at a time
            let isEmpty = false;
            if (pElement.innerHTML.replace(Constants.ZWSP, "") === "\n" ||
                pElement.innerHTML.replace(Constants.ZWSP, "") === "") {
                // Empty P
                isEmpty = true;
                pElement.remove();
            } else if (pElement.innerHTML.endsWith("\n\n") &&
                getSelectPosition(pElement, vditor[vditor.currentMode].element, range).start ===
                pElement.textContent.length - 1) {
                // Soft line break
                pElement.innerHTML = pElement.innerHTML.substr(0, pElement.innerHTML.length - 2);
                isEmpty = true;
            }
            if (isEmpty) {
                // Need to add a zero-width character; otherwise undo cannot be recorded
                blockquoteElement.insertAdjacentHTML("afterend", `<p data-block="0">${Constants.ZWSP}<wbr>\n</p>`);
                setRangeByWbr(vditor[vditor.currentMode].element, range);
                execAfterRender(vditor);
                event.preventDefault();
                return true;
            }
        }
        const blockElement = hasClosestBlock(startContainer);
        if (vditor.currentMode === "wysiwyg" && blockElement && matchHotKey("⇧⌘;", event)) {
            // Insert blockquote
            range.insertNode(document.createElement("wbr"));
            blockElement.outerHTML = `<blockquote data-block="0">${blockElement.outerHTML}</blockquote>`;
            setRangeByWbr(vditor.wysiwyg.element, range);
            afterRenderEvent(vditor);
            event.preventDefault();
            return true;
        }

        if (insertAfterBlock(vditor, event, range, blockquoteElement, blockquoteElement)) {
            return true;
        }
        if (insertBeforeBlock(vditor, event, range, blockquoteElement, blockquoteElement)) {
            return true;
        }
    }
    return false;
};

export const fixTask = (vditor: IVditor, range: Range, event: KeyboardEvent) => {
    const startContainer = range.startContainer;
    const taskItemElement = hasClosestByMatchTag(startContainer, "LI");
    if (taskItemElement && taskItemElement.classList.contains("vditor-task")) {
        if (matchHotKey("⇧⌘J", event)) {
            // ctrl + shift: toggle checked
            const inputElement = taskItemElement.firstElementChild as HTMLInputElement;
            if (inputElement.checked) {
                inputElement.removeAttribute("checked");
            } else {
                inputElement.setAttribute("checked", "checked");
            }
            execAfterRender(vditor);
            event.preventDefault();
            return true;
        }

        // Backspace: delete before the checkbox input
        if (event.key === "Backspace" && !isCtrl(event) && !event.shiftKey && !event.altKey && range.toString() === ""
            && range.startOffset === 1
            && ((startContainer.nodeType === 3 && startContainer.previousSibling &&
                    (startContainer.previousSibling as HTMLElement).tagName === "INPUT")
                || startContainer.nodeType !== 3)) {
            const previousElement = taskItemElement.previousElementSibling;
            taskItemElement.querySelector("input").remove();
            if (previousElement) {
                const lastNode = getLastNode(previousElement);
                lastNode.parentElement.insertAdjacentHTML("beforeend", "<wbr>" + taskItemElement.innerHTML.trim());
                taskItemElement.remove();
            } else {
                taskItemElement.parentElement.insertAdjacentHTML("beforebegin",
                    `<p data-block="0"><wbr>${taskItemElement.innerHTML.trim() || "\n"}</p>`);
                if (taskItemElement.nextElementSibling) {
                    taskItemElement.remove();
                } else {
                    taskItemElement.parentElement.remove();
                }
            }
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            event.preventDefault();
            return true;
        }

        if (event.key === "Enter" && !isCtrl(event) && !event.shiftKey && !event.altKey) {
            if (taskItemElement.textContent.trim() === "") {
                // current task item is empty
                if (hasClosestByClassName(taskItemElement.parentElement, "vditor-task")) {
                    // When nested, perform outdent
                    const topListElement = getTopList(startContainer);
                    if (topListElement) {
                        listOutdent(vditor, taskItemElement, range, topListElement);
                    }
                } else {
                    // single-level task list only
                    if (taskItemElement.nextElementSibling) {
                        // There are elements after the task list; use a paragraph to separate
                        let afterHTML = "";
                        let beforeHTML = "";
                        let isAfter = false;
                        Array.from(taskItemElement.parentElement.children).forEach((taskItem) => {
                            if (taskItemElement.isSameNode(taskItem)) {
                                isAfter = true;
                            } else {
                                if (isAfter) {
                                    afterHTML += taskItem.outerHTML;
                                } else {
                                    beforeHTML += taskItem.outerHTML;
                                }
                            }
                        });
                        const parentTagName = taskItemElement.parentElement.tagName;
                        const dataMarker = taskItemElement.parentElement.tagName === "OL" ? "" : ` data-marker="${taskItemElement.parentElement.getAttribute("data-marker")}"`;
                        let startAttribute = "";
                        if (beforeHTML) {
                            startAttribute = taskItemElement.parentElement.tagName === "UL" ? "" : ` start="1"`;
                            beforeHTML = `<${parentTagName} data-tight="true"${dataMarker} data-block="0">${beforeHTML}</${parentTagName}>`;
                        }
                        // <p data-block="0">\n<wbr></p> => <p data-block="0"><wbr>\n</p>
                        // https://github.com/Vanessa219/vditor/issues/430
                        taskItemElement.parentElement.outerHTML = `${beforeHTML}<p data-block="0"><wbr>\n</p><${parentTagName}
 data-tight="true"${dataMarker} data-block="0"${startAttribute}>${afterHTML}</${parentTagName}>`;
                    } else {
                        // No task list elements after the current task list
                        taskItemElement.parentElement.insertAdjacentHTML("afterend", `<p data-block="0"><wbr>\n</p>`);
                        if (taskItemElement.parentElement.querySelectorAll("li").length === 1) {
                            // If task list has only one item, replace with a <p> element
                            taskItemElement.parentElement.remove();
                        } else {
                            // If multiple items and current task is the last, remove this task item
                            taskItemElement.remove();
                        }
                    }
                }
            } else if (startContainer.nodeType !== 3 && range.startOffset === 0 &&
                (startContainer.firstChild as HTMLElement).tagName === "INPUT") {
                // Caret is before the input
                range.setStart(startContainer.childNodes[1], 1);
            } else {
                // Current task item has text; text after caret should be added to a new task list item
                range.setEndAfter(taskItemElement.lastChild);
                taskItemElement.insertAdjacentHTML("afterend", `<li class="vditor-task" data-marker="${taskItemElement.getAttribute("data-marker")}"><input type="checkbox"> <wbr></li>`);
                document.querySelector("wbr").after(range.extractContents());
            }
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            scrollCenter(vditor);
            event.preventDefault();
            return true;
        }
    }
    return false;
};

export const fixDelete = (vditor: IVditor, range: Range, event: KeyboardEvent, pElement: HTMLElement | false) => {
    if (range.startContainer.nodeType !== 3) {
        // Caret is before an HR; there is content before the HR
        const rangeElement = (range.startContainer as HTMLElement).children[range.startOffset];
        if (rangeElement && rangeElement.tagName === "HR") {
            range.selectNodeContents(rangeElement.previousElementSibling);
            range.collapse(false);
            event.preventDefault();
            return true;
        }
    }

    if (pElement) {
        const previousElement = pElement.previousElementSibling;
        if (previousElement && getSelectPosition(pElement, vditor[vditor.currentMode].element, range).start === 0 &&
            ((isFirefox() && previousElement.tagName === "HR") || previousElement.tagName === "TABLE")) {
            if (previousElement.tagName === "TABLE") {
                // Delete after table https://github.com/Vanessa219/vditor/issues/243
                const lastCellElement = previousElement.lastElementChild.lastElementChild.lastElementChild;
                lastCellElement.innerHTML =
                    lastCellElement.innerHTML.trimLeft() + "<wbr>" + pElement.textContent.trim();
                pElement.remove();
            } else {
                // Delete when caret is after HR
                previousElement.remove();
            }
            setRangeByWbr(vditor[vditor.currentMode].element, range);
            execAfterRender(vditor);
            event.preventDefault();
            return true;
        }
    }
    return false;
};

export const fixHR = (range: Range) => {
    if (isFirefox() && range.startContainer.nodeType !== 3 &&
        (range.startContainer as HTMLElement).tagName === "HR") {
        range.setStartBefore(range.startContainer);
    }
};

// firefox https://github.com/Vanessa219/vditor/issues/407
export const fixFirefoxArrowUpTable = (event: KeyboardEvent, blockElement: false | HTMLElement, range: Range) => {
    if (!isFirefox()) {
        return false;
    }
    if (event.key === "ArrowUp" && blockElement && blockElement.previousElementSibling?.tagName === "TABLE") {
        const tableElement = blockElement.previousElementSibling as HTMLTableElement;
        range.selectNodeContents(tableElement.rows[tableElement.rows.length - 1].lastElementChild);
        range.collapse(false);
        event.preventDefault();
        return true;
    }
    if (event.key === "ArrowDown" && blockElement && blockElement.nextElementSibling?.tagName === "TABLE") {
        range.selectNodeContents((blockElement.nextElementSibling as HTMLTableElement).rows[0].cells[0]);
        range.collapse(true);
        event.preventDefault();
        return true;
    }
    return false;
};

export const paste = async (vditor: IVditor, event: (ClipboardEvent | DragEvent) & {target: HTMLElement}, callback: {
    pasteCode(code: string): void,
}) => {
    if (vditor[vditor.currentMode].element.getAttribute("contenteditable") !== "true") {
        return;
    }
    event.stopPropagation();
    event.preventDefault();
    let textHTML;
    let textPlain;
    let files;

    if ("clipboardData" in event) {
        textHTML = event.clipboardData.getData("text/html");
        textPlain = event.clipboardData.getData("text/plain");
        files = event.clipboardData.files;
    } else {
        textHTML = event.dataTransfer.getData("text/html");
        textPlain = event.dataTransfer.getData("text/plain");
        if (event.dataTransfer.types.includes("Files")) {
            files = event.dataTransfer.items;
        }
    }
    const renderers: {
        HTML2VditorDOM?: ILuteRender,
        HTML2VditorIRDOM?: ILuteRender,
        Md2VditorDOM?: ILuteRender,
        Md2VditorIRDOM?: ILuteRender,
        Md2VditorSVDOM?: ILuteRender,
    } = {};
    const renderLinkDest: ILuteRenderCallback = (node, entering) => {
        if (!entering) {
            return ["", Lute.WalkContinue];
        }

        if (vditor.options.upload.renderLinkDest) {
            return vditor.options.upload.renderLinkDest(vditor, node, entering);
        }

        const src = node.TokensStr();
        if (node.__internal_object__.Parent.Type === 34 && src && src.indexOf("file://") === -1 &&
            vditor.options.upload.linkToImgUrl) {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", vditor.options.upload.linkToImgUrl);
            if (vditor.options.upload.token) {
                xhr.setRequestHeader("X-Upload-Token", vditor.options.upload.token);
            }
            if (vditor.options.upload.withCredentials) {
                xhr.withCredentials = true;
            }
            setHeaders(vditor, xhr);
            xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        let responseText = xhr.responseText;
                        if (vditor.options.upload.linkToImgFormat) {
                            responseText = vditor.options.upload.linkToImgFormat(xhr.responseText);
                        }
                        const responseJSON = JSON.parse(responseText);
                        if (responseJSON.code !== 0) {
                            vditor.tip.show(responseJSON.msg);
                            return;
                        }
                        const original = responseJSON.data.originalURL;
                        if (vditor.currentMode === "sv") {
                            vditor.sv.element.querySelectorAll(".vditor-sv__marker--link")
                                .forEach((item: HTMLElement) => {
                                    if (item.textContent === original) {
                                        item.textContent = responseJSON.data.url;
                                    }
                                });
                        } else {
                            const imgElement: HTMLImageElement =
                                vditor[vditor.currentMode].element.querySelector(`img[src="${original}"]`);
                            imgElement.src = responseJSON.data.url;
                            if (vditor.currentMode === "ir") {
                                imgElement.previousElementSibling.previousElementSibling.innerHTML =
                                    responseJSON.data.url;
                            }
                        }
                        execAfterRender(vditor);
                    } else {
                        vditor.tip.show(xhr.responseText);
                    }
                    if (vditor.options.upload.linkToImgCallback) {
                        vditor.options.upload.linkToImgCallback(xhr.responseText);
                    }
                }
            };
            xhr.send(JSON.stringify({url: src}));
        }
        if (vditor.currentMode === "ir") {
            return [`<span class="vditor-ir__marker vditor-ir__marker--link">${Lute.EscapeHTMLStr(src)}</span>`, Lute.WalkContinue];
        } else if (vditor.currentMode === "wysiwyg") {
            return ["", Lute.WalkContinue];
        } else {
            return [`<span class="vditor-sv__marker--link">${Lute.EscapeHTMLStr(src)}</span>`, Lute.WalkContinue];
        }
    };

    // Browser address bar copy handling
    if (textHTML.replace(/&amp;/g, "&").replace(/<(|\/)(html|body|meta)[^>]*?>/ig, "").trim() ===
        `<a href="${textPlain}">${textPlain}</a>` ||
        textHTML.replace(/&amp;/g, "&").replace(/<(|\/)(html|body|meta)[^>]*?>/ig, "").trim() ===
        `<!--StartFragment--><a href="${textPlain}">${textPlain}</a><!--EndFragment-->`) {
        textHTML = "";
    }

    // process word
    const doc = new DOMParser().parseFromString(textHTML, "text/html");
    if (doc.body) {
        textHTML = doc.body.innerHTML;
    }
    textHTML = Lute.Sanitize(textHTML);
    vditor.wysiwyg.getComments(vditor);

    // process code
    const height = vditor[vditor.currentMode].element.scrollHeight;
    const code = processPasteCode(textHTML, textPlain, vditor.currentMode);
    const codeElement = vditor.currentMode === "sv" ?
        hasClosestByAttribute(event.target, "data-type", "code-block") :
        hasClosestByMatchTag(event.target, "CODE");
    if (codeElement) {
        // Paste in code location
        if (vditor.currentMode === "sv") {
            document.execCommand("insertHTML", false, textPlain.replace(/&/g, "&amp;").replace(/</g, "&lt;"));
        } else {
            const position = getSelectPosition(event.target, vditor[vditor.currentMode].element);
            if (codeElement.parentElement.tagName !== "PRE") {
                // https://github.com/Vanessa219/vditor/issues/463
                textPlain += Constants.ZWSP;
            }
            codeElement.textContent = codeElement.textContent.substring(0, position.start)
                + textPlain + codeElement.textContent.substring(position.end);
            setSelectionByPosition(position.start + textPlain.length, position.start + textPlain.length,
                codeElement.parentElement);
            if (codeElement.parentElement?.nextElementSibling.classList
                .contains(`vditor-${vditor.currentMode}__preview`)) {
                codeElement.parentElement.nextElementSibling.innerHTML = codeElement.outerHTML;
                processCodeRender(codeElement.parentElement.nextElementSibling as HTMLElement, vditor);
            }
        }
    } else if (code) {
        callback.pasteCode(code);
    } else {
        if (textHTML.trim() !== "") {
            const tempElement = document.createElement("div");
            tempElement.innerHTML = textHTML;
            if (!vditor.options.upload.base64ToLink) {
                // Word copy may contain mixed images and text; replace VML image tags with links: <v:imagedata src="file:///C:/Users/ADMINI~1/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png" o:title="">
                await processVMLImage(vditor, tempElement, ("clipboardData" in event ? event.clipboardData : event.dataTransfer).getData("text/rtf"));
            }

            tempElement.querySelectorAll("[style]").forEach((e) => {
                e.removeAttribute("style");
            });
            tempElement.querySelectorAll(".vditor-copy").forEach((e) => {
                e.remove();
            });
            if (vditor.currentMode === "ir") {
                renderers.HTML2VditorIRDOM = {renderLinkDest};
                vditor.lute.SetJSRenderers({renderers});
                insertHTML(vditor.lute.HTML2VditorIRDOM(tempElement.innerHTML), vditor);
            } else if (vditor.currentMode === "wysiwyg") {
                renderers.HTML2VditorDOM = {renderLinkDest};
                vditor.lute.SetJSRenderers({renderers});
                insertHTML(vditor.lute.HTML2VditorDOM(tempElement.innerHTML), vditor);
            } else {
                renderers.Md2VditorSVDOM = {renderLinkDest};
                vditor.lute.SetJSRenderers({renderers});
                processPaste(vditor, vditor.lute.HTML2Md(tempElement.innerHTML).trimRight());
            }
            vditor.outline.render(vditor);
        } else if (files.length > 0) {
            if (vditor.options.upload.url || vditor.options.upload.handler) {
                await uploadFiles(vditor, files);
            } else {
                const fileReader = new FileReader();
                let file: File;
                if ("clipboardData" in event) {
                    files = event.clipboardData.files;
                    file = files[0];
                } else if (event.dataTransfer.types.includes("Files")) {
                    files = event.dataTransfer.items;
                    file = files[0].getAsFile();
                }
                if (file && file.type.startsWith("image")) {
                    fileReader.readAsDataURL(file);
                    fileReader.onload = () => {
                        let imgHTML = "";
                        if (vditor.currentMode === "wysiwyg") {
                            imgHTML += `<img alt="${file.name}" src="${fileReader.result.toString()}">\n`;
                        } else {
                            imgHTML += `![${file.name}](${fileReader.result.toString()})\n`;
                        }
                        document.execCommand("insertHTML", false, imgHTML);
                    };
                }
            }
        } else if (textPlain.trim() !== "" && files.length === 0) {
            const range = getEditorRange(vditor);
            if (range.toString() !== "" && vditor.lute.IsValidLinkDest(textPlain)) {
                textPlain = `[${range.toString()}](${textPlain})`;
            }
            if (vditor.currentMode === "ir") {
                renderers.Md2VditorIRDOM = {renderLinkDest};
                vditor.lute.SetJSRenderers({renderers});
                insertHTML(Lute.Sanitize(vditor.lute.Md2VditorIRDOM(textPlain)), vditor);
            } else if (vditor.currentMode === "wysiwyg") {
                renderers.Md2VditorDOM = {renderLinkDest};
                vditor.lute.SetJSRenderers({renderers});
                insertHTML(Lute.Sanitize(vditor.lute.Md2VditorDOM(textPlain)), vditor);
            } else {
                renderers.Md2VditorSVDOM = {renderLinkDest};
                vditor.lute.SetJSRenderers({renderers});
                processPaste(vditor, textPlain);
            }
            vditor.outline.render(vditor);
        }
    }
    if (vditor.currentMode !== "sv") {
        const blockElement = hasClosestBlock(getEditorRange(vditor).startContainer);
        if (blockElement) {
            // https://github.com/Vanessa219/vditor/issues/591
            const range = getEditorRange(vditor);
            vditor[vditor.currentMode].element.querySelectorAll("wbr").forEach((wbr) => {
                wbr.remove();
            });
            range.insertNode(document.createElement("wbr"));
            if (vditor.currentMode === "wysiwyg") {
                blockElement.outerHTML = vditor.lute.SpinVditorDOM(blockElement.outerHTML);
            } else {
                blockElement.outerHTML = vditor.lute.SpinVditorIRDOM(blockElement.outerHTML);
            }
            setRangeByWbr(vditor[vditor.currentMode].element, range);
        }
        vditor[vditor.currentMode].element.querySelectorAll(`.vditor-${vditor.currentMode}__preview[data-render='2']`)
            .forEach((item: HTMLElement) => {
                processCodeRender(item, vditor);
            });
    }
    vditor.wysiwyg.triggerRemoveComment(vditor);
    execAfterRender(vditor);
    if (vditor[vditor.currentMode].element.scrollHeight - height >
        Math.min(vditor[vditor.currentMode].element.clientHeight, window.innerHeight) / 2) {
        scrollCenter(vditor);
    }
};

const processVMLImage = async (vditor: IVditor, root: Element, rtfData: string) => {
    if (!rtfData) {
        return;

    }

    const regexPictureHeader = /{\\pict[\s\S]+?\\bliptag-?\d+(\\blipupi-?\d+)?({\\\*\\blipuid\s?[\da-fA-F]+)?[\s}]*?/;
    const regexPicture = new RegExp("(?:(" + regexPictureHeader.source + "))([\\da-fA-F\\s]+)\\}", "g");
    const regImages = rtfData.match(regexPicture);
    const images = [];
    if (regImages) {
        for (const image of regImages) {
            let imageType;

            if (image.includes("\\pngblip")) {
                imageType = "image/png";
            } else if (image.includes("\\jpegblip")) {
                imageType = "image/jpeg";
            }

            if (imageType) {
                images.push({
                    hex: image.replace(regexPictureHeader, "").replace(/[^\da-fA-F]/g, ""),
                    type: imageType,
                });
            }
        }
    }

    const shapes: Array<{shape: Element, img: Element}> = [];
    walk(root, (child: Element) => {
        if (child.tagName === "V:SHAPE") {
            walk(child, (sub) => {
                if (sub.tagName === "V:IMAGEDATA") shapes.push({shape: child, img: sub});
            });
            return false;
        }
    });
    for (let i = 0; i < shapes.length; i++) {
        const img = document.createElement("img");
        const newSrc = "data:" + images[i].type + ";base64," + btoa((images[i].hex.match(/\w{2}/g) || []).map(char => {
            return String.fromCharCode(parseInt(char, 16));
        }).join(""));
        img.src = newSrc;
        img.title = shapes[i].img.getAttribute("title");
        shapes[i].shape.parentNode.replaceChild(img, shapes[i].shape);
    }

    const imgs = root.querySelectorAll("img");
    for (let i = 0; i < imgs.length; i++) {
        const src = imgs[i].src || "";
        if (src) imgs[i].src = await vditor.options.upload.base64ToLink(src);
    }
};

const walk = (el: Element, fn: (el: Element) => boolean | void) => {
    const goNext = fn(el);
    if (goNext !== false)
        for (let i = 0; i < el.children.length; i++) {
            walk(el.children[i], fn);
        }
};
