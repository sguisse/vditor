import {Constants} from "../constants";
import {isHeadingMD, isHrMD} from "../util/fixBrowserBehavior";
import {
    getTopList,
    hasClosestBlock, hasClosestByAttribute,
    hasClosestByClassName,
} from "../util/hasClosest";
import {hasClosestByTag} from "../util/hasClosestByHeadings";
import {log} from "../util/log";
import {processCodeRender} from "../util/processCode";
import {getSelectPosition, setRangeByWbr} from "../util/selection";
import {renderToc} from "../util/toc";
import {processAfterRender} from "./process";
import {getMarkdown} from "../markdown/getMarkdown";

export const input = (vditor: IVditor, range: Range, ignoreSpace = false, event?: InputEvent) => {
    let blockElement = hasClosestBlock(range.startContainer);
    // Allow spaces before/after
    if (blockElement && !ignoreSpace && blockElement.getAttribute("data-type") !== "code-block") {
        if ((isHrMD(blockElement.innerHTML) && blockElement.previousElementSibling) ||
            isHeadingMD(blockElement.innerHTML)) {
            return;
        }

        // Handle leading/trailing spaces
        const startOffset = getSelectPosition(blockElement, vditor.ir.element, range).start;

        // Leading spaces allowed
        let startSpace = true;
        for (let i = startOffset - 1;
            // Spaces after soft line break
             i > blockElement.textContent.substr(0, startOffset).lastIndexOf("\n");
             i--) {
            if (blockElement.textContent.charAt(i) !== " " &&
                // Deleting multiple leading tabs does not form a code block https://github.com/Vanessa219/vditor/issues/162 1
                blockElement.textContent.charAt(i) !== "\t") {
                startSpace = false;
                break;
            }
        }
        if (startOffset === 0) {
            startSpace = false;
        }

        // Trailing spaces allowed
        let endSpace = true;
        for (let i = startOffset - 1; i < blockElement.textContent.length; i++) {
            if (blockElement.textContent.charAt(i) !== " " && blockElement.textContent.charAt(i) !== "\n") {
                endSpace = false;
                break;
            }
        }

        if (startSpace) {
            if (typeof vditor.options.input === "function") {
                vditor.options.input(getMarkdown(vditor));
            }
            return;
        }

        // https://github.com/Vanessa219/vditor/issues/729
        if (endSpace && /^#{1,6} $/.test(blockElement.textContent)) {
            endSpace = false;
        }

        if (endSpace) {
            const markerElement = hasClosestByClassName(range.startContainer, "vditor-ir__marker");
            if (markerElement) {
                // Inline marker space https://github.com/Vanessa219/vditor/issues/239
            } else {
                const previousNode = range.startContainer.previousSibling as HTMLElement;
                if (previousNode && previousNode.nodeType !== 3 && previousNode.classList.contains("vditor-ir__node--expand")) {
                    // Firefox https://github.com/Vanessa219/vditor/issues/239
                    previousNode.classList.remove("vditor-ir__node--expand");
                }
                if (typeof vditor.options.input === "function") {
                    vditor.options.input(getMarkdown(vditor));
                }
                return;
            }
        }
    }

    vditor.ir.element.querySelectorAll(".vditor-ir__node--expand").forEach((item) => {
        item.classList.remove("vditor-ir__node--expand");
    });

    if (!blockElement) {
        // Use top-level block element; use innerHTML
        blockElement = vditor.ir.element;
    }

    // document.execCommand insertHTML inserts wbr
    if (!blockElement.querySelector("wbr")) {
        const previewRenderElement = hasClosestByClassName(range.startContainer, "vditor-ir__preview");
        if (previewRenderElement) {
            previewRenderElement.previousElementSibling.insertAdjacentHTML("beforeend", "<wbr>");
        } else {
            range.insertNode(document.createElement("wbr"));
        }
    }

    // Remove browser default inline styles
    blockElement.querySelectorAll("[style]").forEach((item) => {
        item.removeAttribute("style");
    });

    if (blockElement.getAttribute("data-type") === "link-ref-defs-block") {
        // Modify link reference definitions
        blockElement = vditor.ir.element;
    }

    const isIRElement = blockElement.isEqualNode(vditor.ir.element);
    const footnoteElement = hasClosestByAttribute(blockElement, "data-type", "footnotes-block");
    let html = "";
    if (!isIRElement) {
        const blockquoteElement = hasClosestByTag(range.startContainer, "BLOCKQUOTE");
        // Lists should be at the top-most nesting level
        const topListElement = getTopList(range.startContainer);
        if (topListElement) {
            blockElement = topListElement;
        }

        // Should be at blockquote level; otherwise "> ---" may be parsed as front-matter.
        // If a list contains a blockquote, parse as blockquote; if a blockquote contains a list, parse as list.
        if (blockquoteElement && (!topListElement || (topListElement && !blockquoteElement.contains(topListElement)))) {
            blockElement = blockquoteElement;
        }

        // Modify footnotes
        if (footnoteElement) {
            blockElement = footnoteElement;
        }

        html = blockElement.outerHTML;

        if (blockElement.tagName === "UL" || blockElement.tagName === "OL") {
            // If it's a list, re-render adjacent lists as well
            const listPrevElement = blockElement.previousElementSibling;
            const listNextElement = blockElement.nextElementSibling;
            if (listPrevElement && (listPrevElement.tagName === "UL" || listPrevElement.tagName === "OL")) {
                html = listPrevElement.outerHTML + html;
                listPrevElement.remove();
            }
            if (listNextElement && (listNextElement.tagName === "UL" || listNextElement.tagName === "OL")) {
                html = html + listNextElement.outerHTML;
                listNextElement.remove();
            }
            // Firefox: pressing Enter in a list may not create a new list item https://github.com/Vanessa219/vditor/issues/194
            html = html.replace("<div><wbr><br></div>", "<li><p><wbr><br></p></li>");
        } else if (blockElement.previousElementSibling &&
            blockElement.previousElementSibling.textContent.replace(Constants.ZWSP, "") !== "" &&
            event && event.inputType === "insertParagraph") {
            // When inserting a new line, handle the previous paragraph
            html = blockElement.previousElementSibling.outerHTML + html;
            blockElement.previousElementSibling.remove();
        }
        if (!blockElement.innerText.startsWith("```")) {
            // Append link reference definitions
            vditor.ir.element.querySelectorAll("[data-type='link-ref-defs-block']").forEach((item) => {
                if (item && !(blockElement as HTMLElement).isEqualNode(item)) {
                    html += item.outerHTML;
                    item.remove();
                }
            });

            // Append footnotes
            vditor.ir.element.querySelectorAll("[data-type='footnotes-block']").forEach((item) => {
                if (item && !(blockElement as HTMLElement).isEqualNode(item)) {
                    html += item.outerHTML;
                    item.remove();
                }
            });
        }
    } else {
        html = blockElement.innerHTML;
    }

    log("SpinVditorIRDOM", html, "argument", vditor.options.debugger);
    html = vditor.lute.SpinVditorIRDOM(html);
    log("SpinVditorIRDOM", html, "result", vditor.options.debugger);

    if (isIRElement) {
        blockElement.innerHTML = html;
    } else {
        blockElement.outerHTML = html;

        // Update tip inside the content
        if (footnoteElement) {
            const footnoteItemElement = hasClosestByAttribute(vditor.ir.element.querySelector("wbr"),
                "data-type", "footnotes-def");
            if (footnoteItemElement) {
                const footnoteItemText = footnoteItemElement.textContent;
                const marker = footnoteItemText.substring(1, footnoteItemText.indexOf("]:"));
                const footnoteRefElement = vditor.ir.element.querySelector(`sup[data-type="footnotes-ref"][data-footnotes-label="${marker}"]`);
                if (footnoteRefElement) {
                    footnoteRefElement.setAttribute("aria-label",
                        footnoteItemText.substr(marker.length + 3).trim().substr(0, 24));
                }
            }
        }
    }

    // Merge and append link reference definitions
    let firstLinkRefDefElement: HTMLElement;
    const allLinkRefDefsElement = vditor.ir.element.querySelectorAll("[data-type='link-ref-defs-block']");
    allLinkRefDefsElement.forEach((item: HTMLElement, index) => {
        if (index === 0) {
            firstLinkRefDefElement = item;
        } else {
            firstLinkRefDefElement.insertAdjacentHTML("beforeend", item.innerHTML);
            item.remove();
        }
    });
    if (allLinkRefDefsElement.length > 0) {
        vditor.ir.element.insertAdjacentElement("beforeend", allLinkRefDefsElement[0]);
    }

    // Append footnotes after merging
    let firstFootnoteElement: HTMLElement;
    const allFootnoteElement = vditor.ir.element.querySelectorAll("[data-type='footnotes-block']");
    allFootnoteElement.forEach((item: HTMLElement, index) => {
        if (index === 0) {
            firstFootnoteElement = item;
        } else {
            firstFootnoteElement.insertAdjacentHTML("beforeend", item.innerHTML);
            item.remove();
        }
    });
    if (allFootnoteElement.length > 0) {
        vditor.ir.element.insertAdjacentElement("beforeend", allFootnoteElement[0]);
    }

    setRangeByWbr(vditor.ir.element, range);

    vditor.ir.element.querySelectorAll(".vditor-ir__preview[data-render='2']").forEach((item: HTMLElement) => {
        processCodeRender(item, vditor);
    });

    renderToc(vditor);

    processAfterRender(vditor, {
        enableAddUndoStack: true,
        enableHint: true,
        enableInput: true,
    });
};
