import {isCtrl} from "../util/compatibility";
import {fixTab} from "../util/fixBrowserBehavior";
import {hasClosestByAttribute} from "../util/hasClosest";
import {hasClosestByTag} from "../util/hasClosestByHeadings";
import {getEditorRange, getSelectPosition} from "../util/selection";
import {inputEvent} from "./inputEvent";
import {processAfterRender, processPreviousMarkers} from "./process";

export const processKeydown = (vditor: IVditor, event: KeyboardEvent) => {
    vditor.sv.composingLock = event.isComposing;
    if (event.isComposing) {
        return false;
    }

    if (event.key.indexOf("Arrow") === -1 && event.key !== "Meta" && event.key !== "Control" && event.key !== "Alt" &&
        event.key !== "Shift" && event.key !== "CapsLock" && event.key !== "Escape" && !/^F\d{1,2}$/.test(event.key)) {
        vditor.undo.recordFirstPosition(vditor, event);
    }
    // Only handle the following shortcut keys
    if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "Backspace" && event.key.indexOf("Arrow") === -1
        && !isCtrl(event) && event.key !== "Escape") {
        return false;
    }
    const range = getEditorRange(vditor);
    let startContainer = range.startContainer;
    if (range.startContainer.nodeType !== 3 && (range.startContainer as HTMLElement).tagName === "DIV") {
        startContainer = range.startContainer.childNodes[range.startOffset - 1];
    }
    const textElement = hasClosestByAttribute(startContainer, "data-type", "text");

    // blockquote
    let blockquoteMarkerElement = hasClosestByAttribute(startContainer, "data-type", "blockquote-marker");
    if (!blockquoteMarkerElement && range.startOffset === 0 && textElement && textElement.previousElementSibling &&
        textElement.previousElementSibling.getAttribute("data-type") === "blockquote-marker") {
        blockquoteMarkerElement = textElement.previousElementSibling as HTMLElement;
    }
    // Press Enter to remove blockquote markers one by one
    if (blockquoteMarkerElement) {
        if (event.key === "Enter" && !isCtrl(event) && !event.altKey &&
            blockquoteMarkerElement.nextElementSibling.textContent.trim() === "" &&
            getSelectPosition(blockquoteMarkerElement, vditor.sv.element, range).start ===
            blockquoteMarkerElement.textContent.length) {
            if (blockquoteMarkerElement.previousElementSibling?.getAttribute("data-type") === "padding") {
                // When a list contains multiple blockquotes, pressing Enter on the marker should exit the list
                blockquoteMarkerElement.previousElementSibling.setAttribute("data-action", "enter-remove");
            }
            blockquoteMarkerElement.remove();
            processAfterRender(vditor);
            event.preventDefault();
            return true;
        }
    }

    // list item
    const listMarkerElement = hasClosestByAttribute(startContainer, "data-type", "li-marker") as HTMLElement;
    const taskMarkerElement = hasClosestByAttribute(startContainer, "data-type", "task-marker") as HTMLElement;
    let listLastMarkerElement = listMarkerElement;
    if (!listLastMarkerElement) {
        if (taskMarkerElement && taskMarkerElement.nextElementSibling.getAttribute("data-type") !== "task-marker") {
            listLastMarkerElement = taskMarkerElement;
        }
    }
    if (!listLastMarkerElement && range.startOffset === 0 && textElement && textElement.previousElementSibling &&
        (textElement.previousElementSibling.getAttribute("data-type") === "li-marker" ||
            textElement.previousElementSibling.getAttribute("data-type") === "task-marker")) {
        listLastMarkerElement = textElement.previousElementSibling as HTMLElement;
    }
    if (listLastMarkerElement) {
        const startIndex = getSelectPosition(listLastMarkerElement, vditor.sv.element, range).start;
        const isTask = listLastMarkerElement.getAttribute("data-type") === "task-marker";
        let listFirstMarkerElement = listLastMarkerElement;
        if (isTask) {
            listFirstMarkerElement = listLastMarkerElement.previousElementSibling.previousElementSibling
                .previousElementSibling as HTMLElement;
        }
        if (startIndex === listLastMarkerElement.textContent.length) {
            // Press Enter to clear the list marker
            if (event.key === "Enter" && !isCtrl(event) && !event.altKey && !event.shiftKey &&
                listLastMarkerElement.nextElementSibling.textContent.trim() === "") {
                if (listFirstMarkerElement.previousElementSibling?.getAttribute("data-type") === "padding") {
                    listFirstMarkerElement.previousElementSibling.remove();
                    inputEvent(vditor);
                } else {
                    if (isTask) {
                        listFirstMarkerElement.remove();
                        listLastMarkerElement.previousElementSibling.previousElementSibling.remove();
                        listLastMarkerElement.previousElementSibling.remove();
                    }
                    listLastMarkerElement.nextElementSibling.remove();
                    listLastMarkerElement.remove();
                    processAfterRender(vditor);
                }
                event.preventDefault();
                return true;
            }
            // Tab after the first marker indents the list
            if (event.key === "Tab") {
                if (event.shiftKey) {
                    if (listFirstMarkerElement.previousElementSibling.getAttribute("data-type") === "padding") {
                        listFirstMarkerElement.previousElementSibling.remove();
                    }
                } else {
                    listFirstMarkerElement.insertAdjacentHTML("beforebegin",
                        `<span data-type="padding">${listFirstMarkerElement.textContent.replace(/\S/g, " ")}</span>`);
                }
                if (/^\d/.test(listFirstMarkerElement.textContent)) {
                    listFirstMarkerElement.textContent = listFirstMarkerElement.textContent.replace(/^\d{1,}/, "1");
                    range.selectNodeContents(listLastMarkerElement.firstChild);
                    range.collapse(false);
                }
                inputEvent(vditor);
                event.preventDefault();
                return true;
            }
        }
    }

    // tab
    if (fixTab(vditor, range, event)) {
        return true;
    }

    const blockElement = hasClosestByAttribute(startContainer, "data-block", "0");
    const spanElement = hasClosestByTag(startContainer, "SPAN");
    // Enter key
    if (event.key === "Enter" && !isCtrl(event) && !event.altKey && !event.shiftKey && blockElement) {
        let isFirst = false;
        const newLineMatch = blockElement.textContent.match(/^\n+/);
        if (getSelectPosition(blockElement, vditor.sv.element).start <= (newLineMatch ? newLineMatch[0].length : 0)) {
            // Allow newline at the start of a paragraph
            isFirst = true;
        }
        let newLineText = "\n";
        if (spanElement) {
            if (spanElement.previousElementSibling?.getAttribute("data-action") === "enter-remove") {
                // https://github.com/Vanessa219/vditor/issues/596
                spanElement.previousElementSibling.remove();
                processAfterRender(vditor);
                event.preventDefault();
                return true;
            } else {
                newLineText += processPreviousMarkers(spanElement);
            }
        }
        range.insertNode(document.createTextNode(newLineText));
        range.collapse(false);
        if (blockElement && blockElement.textContent.trim() !== "" && !isFirst) {
            inputEvent(vditor);
        } else {
            processAfterRender(vditor);
        }
        event.preventDefault();
        return true;
    }

    // Handle deletion when a newline is immediately before the caret
    if (event.key === "Backspace" && !isCtrl(event) && !event.altKey && !event.shiftKey) {
        if (spanElement && spanElement.previousElementSibling?.getAttribute("data-type") === "newline" &&
            getSelectPosition(spanElement, vditor.sv.element, range).start === 1 &&
            // Floating marker handling must be done in inputEvent to keep alignment
            spanElement.getAttribute("data-type").indexOf("code-block-") === -1) {
            // Cursor is after the first character of the line
            range.setStart(spanElement, 0);
            range.extractContents();
            if (spanElement.textContent.trim() !== "") {
                inputEvent(vditor);
            } else {
                processAfterRender(vditor);
            }
            event.preventDefault();
            return true;
        }
        // Before the first character of the paragraph
        if (blockElement && getSelectPosition(blockElement, vditor.sv.element, range).start === 0 &&
            blockElement.previousElementSibling) {
            range.extractContents();
            let previousLastElement = blockElement.previousElementSibling.lastElementChild;
            if (previousLastElement.getAttribute("data-type") === "newline") {
                previousLastElement.remove();
                previousLastElement = blockElement.previousElementSibling.lastElementChild;
            }
            // Scenario: cannot delete at the end of a fenced code block
            if (previousLastElement.getAttribute("data-type") !== "newline") {
                previousLastElement.insertAdjacentHTML("afterend", blockElement.innerHTML);
                blockElement.remove();
            }
            if (blockElement.textContent.trim() !== "" && !blockElement.previousElementSibling?.querySelector('[data-type="code-block-open-marker"]')) {
                inputEvent(vditor);
            } else {
                if (previousLastElement.getAttribute("data-type") !== "newline") {
                    // https://github.com/Vanessa219/vditor/issues/597
                    range.selectNodeContents(previousLastElement.lastChild);
                    range.collapse(false);
                }
                processAfterRender(vditor);
            }
            event.preventDefault();
            return true;
        }
    }
    return false;
};
