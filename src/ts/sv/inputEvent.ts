import {scrollCenter} from "../util/editorCommonEvent";
import {hasClosestByAttribute} from "../util/hasClosest";
import {getSelectPosition, setRangeByWbr} from "../util/selection";
import {getSideByType, processAfterRender, processSpinVditorSVDOM} from "./process";
import {combineFootnote} from "./combineFootnote";

export const inputEvent = (vditor: IVditor, event?: InputEvent) => {
    const range = getSelection().getRangeAt(0).cloneRange();
    let startContainer = range.startContainer;
    if (range.startContainer.nodeType !== 3 && (range.startContainer as HTMLElement).tagName === "DIV") {
        startContainer = range.startContainer.childNodes[range.startOffset - 1];
    }
    let blockElement = hasClosestByAttribute(startContainer, "data-block", "0");
    // Do not invoke lute parsing
    if (blockElement && event && (event.inputType === "deleteContentBackward" || event.data === " ")) {
        // Allow entering leading spaces
        const startOffset = getSelectPosition(blockElement, vditor.sv.element, range).start;
        let startSpace = true;
        for (let i = startOffset - 1;
            // There may be spaces after a soft line break
             i > blockElement.textContent.substr(0, startOffset).lastIndexOf("\n"); i--) {
            if (blockElement.textContent.charAt(i) !== " " &&
                // Deleting multiple leading tabs does not form a code block https://github.com/Vanessa219/vditor/issues/162
                blockElement.textContent.charAt(i) !== "\t") {
                startSpace = false;
                break;
            }
        }
        if (startOffset === 0) {
            startSpace = false;
        }
        if (startSpace) {
            processAfterRender(vditor);
            return;
        }

        if (event.inputType === "deleteContentBackward") {
            // https://github.com/Vanessa219/vditor/issues/584 code block marker deletion
            const codeBlockMarkerElement =
                hasClosestByAttribute(startContainer, "data-type", "code-block-open-marker") ||
                hasClosestByAttribute(startContainer, "data-type", "code-block-close-marker");
            if (codeBlockMarkerElement) {
                if (codeBlockMarkerElement.getAttribute("data-type") === "code-block-close-marker") {
                    const openMarkerElement = getSideByType(startContainer, "code-block-open-marker");
                    if (openMarkerElement) {
                        openMarkerElement.textContent = codeBlockMarkerElement.textContent;
                        processAfterRender(vditor);
                        return;
                    }
                }
                if (codeBlockMarkerElement.getAttribute("data-type") === "code-block-open-marker") {
                    const openMarkerElement = getSideByType(startContainer, "code-block-close-marker", false);
                    if (openMarkerElement) {
                        openMarkerElement.textContent = codeBlockMarkerElement.textContent;
                        processAfterRender(vditor);
                        return;
                    }
                }
            }
            // https://github.com/Vanessa219/vditor/issues/877 math formula input deletion generating nodes
            const mathBlockMarkerElement =
                hasClosestByAttribute(startContainer, "data-type", "math-block-open-marker");
            if (mathBlockMarkerElement) {
                const mathBlockCloseElement = mathBlockMarkerElement.nextElementSibling.nextElementSibling;
                if (mathBlockCloseElement && mathBlockCloseElement.getAttribute("data-type") === "math-block-close-marker") {
                    mathBlockCloseElement.remove();
                    processAfterRender(vditor);
                }
                return;
            }

            blockElement.querySelectorAll('[data-type="code-block-open-marker"]').forEach((item: HTMLElement) => {
                if (item.textContent.length === 1) {
                    item.remove();
                }
            });
            blockElement.querySelectorAll('[data-type="code-block-close-marker"]').forEach((item: HTMLElement) => {
                if (item.textContent.length === 1) {
                    item.remove();
                }
            });

            // Heading deletion
            const headingElement = hasClosestByAttribute(startContainer, "data-type", "heading-marker");
            if (headingElement && headingElement.textContent.indexOf("#") === -1) {
                processAfterRender(vditor);
                return;
            }
        }
        // Do not parse on delete or space, otherwise it will be reformatted
        if ((event.data === " " || event.inputType === "deleteContentBackward") &&
            (hasClosestByAttribute(startContainer, "data-type", "padding") // Scenario: deleting before 'b' in blockquote [> 1. a\n>   b]
                || hasClosestByAttribute(startContainer, "data-type", "li-marker")  // Scenario: deleting the last character [* 1\n* ]
                || hasClosestByAttribute(startContainer, "data-type", "task-marker")  // Scenario: deleting the last character in task list [* [ ] ]
                || hasClosestByAttribute(startContainer, "data-type", "blockquote-marker")  // Scenario: deleting the last character from blockquote [> ]
            )) {
            processAfterRender(vditor);
            return;
        }
    }
    if (blockElement && blockElement.textContent.trimRight() === "$$") {
        // Inline math expression
        processAfterRender(vditor);
        return;
    }
    if (!blockElement) {
        blockElement = vditor.sv.element;
    }
    if (blockElement.firstElementChild?.getAttribute("data-type") === "link-ref-defs-block") {
        // Modify link reference definitions
        blockElement = vditor.sv.element;
    }
    if (hasClosestByAttribute(startContainer, "data-type", "footnotes-link")) {
        // Modify footnote markers
        blockElement = vditor.sv.element;
    }
    // Insert caret position
    if (blockElement.textContent.indexOf(Lute.Caret) === -1) {
        // Clicking the toolbar will insert Caret
        range.insertNode(document.createTextNode(Lute.Caret));
    }
    // Remove browser inline styles
    blockElement.querySelectorAll("[style]").forEach((item) => { // Cannot run earlier; it would affect newline styles
        item.removeAttribute("style");
    });
    blockElement.querySelectorAll("font").forEach((item) => { // Cannot run earlier; it would affect caret position
        item.outerHTML = item.innerHTML;
    });
    let html = blockElement.textContent;
    const isSVElement = blockElement.isEqualNode(vditor.sv.element);
    if (isSVElement) {
        html = blockElement.textContent;
    } else {
        // Append previous block element's content
        if (blockElement.previousElementSibling) {
            html = blockElement.previousElementSibling.textContent + html;
            blockElement.previousElementSibling.remove();
        }
        if (blockElement.previousElementSibling && html.indexOf("---\n") === 0) {
            // Confirm whether YAML front matter is at the first line
            html = blockElement.previousElementSibling.textContent + html;
            blockElement.previousElementSibling.remove();
        }
        // Append link reference definitions
        let footnotes = ""

        vditor.sv.element.querySelectorAll("[data-type='link-ref-defs-block']").forEach((item, index) => {
            if (item && !(blockElement as HTMLElement).isEqualNode(item.parentElement)) {
                footnotes += item.parentElement.textContent + "\n";
                item.parentElement.remove();
            }
        });

        // Append footnotes to the top of the document to facilitate lute processing
        vditor.sv.element.querySelectorAll("[data-type='footnotes-link']").forEach((item, index) => {
            if (item && !(blockElement as HTMLElement).isEqualNode(item.parentElement)) {
                footnotes += item.parentElement.textContent + "\n";
                item.parentElement.remove();
            }
        });
        html = footnotes + html;
    }
    html = processSpinVditorSVDOM(html, vditor);
    if (isSVElement) {
        blockElement.innerHTML = html;
    } else {
        blockElement.outerHTML = html;
    }

    vditor.sv.element.querySelectorAll("[data-type='link-ref-defs-block']").forEach((item) => {
        vditor.sv.element.insertAdjacentElement("beforeend", item.parentElement)
    })

    // Combine footnotes
    combineFootnote(vditor.sv.element, (root: HTMLElement) => {
        vditor.sv.element.insertAdjacentElement("beforeend", root)
    })

    setRangeByWbr(vditor.sv.element, range);

    scrollCenter(vditor);

    processAfterRender(vditor, {
        enableAddUndoStack: true,
        enableHint: true,
        enableInput: true,
    });
};
