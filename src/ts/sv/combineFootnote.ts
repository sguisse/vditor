/**
 * Combine footnotes
 * @param elements vditor.sv.element
 * @param afterCombine Callback invoked after each footnote block is combined. Param: root is the combined footnote block
 */
export const combineFootnote = (elements: HTMLElement, afterCombine?: (root: HTMLElement) => void ) => {
    elements.querySelectorAll("[data-type=footnotes-link]").forEach((el: Element) => {
        const root = el.parentElement
        let footnote = root.nextSibling
        // Find all blocks corresponding to this footnote
        while (footnote) {
            if (footnote.textContent.startsWith("    ")) {
                // Found four leading spaces; append nodes to root and continue parsing
                const thisNode = footnote
                thisNode.childNodes.forEach(node => {
                    root.append(node.cloneNode(true))
                })
                footnote = footnote.nextSibling
                thisNode.remove()
            } else {
                // Stop parsing when no leading spaces are found
                break
            }
        }
        afterCombine && afterCombine(root)
    })
}
