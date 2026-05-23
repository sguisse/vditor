import "./assets/less/index.less";
import VditorMethod from "./method";
import {Constants, VDITOR_VERSION} from "./ts/constants";
import {DevTools} from "./ts/devtools/index";
import {Hint} from "./ts/hint/index";
import {IR} from "./ts/ir/index";
import {input as irInput} from "./ts/ir/input";
import {processAfterRender} from "./ts/ir/process";
import {getHTML} from "./ts/markdown/getHTML";
import {getMarkdown} from "./ts/markdown/getMarkdown";
import {setLute} from "./ts/markdown/setLute";
import {Outline} from "./ts/outline/index";
import {Preview} from "./ts/preview/index";
import {Resize} from "./ts/resize/index";
import {Editor} from "./ts/sv/index";
import {inputEvent} from "./ts/sv/inputEvent";
import {processAfterRender as processSVAfterRender, processPaste} from "./ts/sv/process";
import {Tip} from "./ts/tip/index";
import {Toolbar} from "./ts/toolbar/index";
import {disableToolbar, hidePanel} from "./ts/toolbar/setToolbar";
import {enableToolbar} from "./ts/toolbar/setToolbar";
import {initUI, UIUnbindListener} from "./ts/ui/initUI";
import {setCodeTheme} from "./ts/ui/setCodeTheme";
import {setContentTheme} from "./ts/ui/setContentTheme";
import {setPreviewMode} from "./ts/ui/setPreviewMode";
import {setTheme} from "./ts/ui/setTheme";
import {Undo} from "./ts/undo/index";
import {Upload} from "./ts/upload/index";
import {addScript, addScriptSync} from "./ts/util/addScript";
import {getSelectText} from "./ts/util/getSelectText";
import {Options} from "./ts/util/Options";
import {processCodeRender} from "./ts/util/processCode";
import {getCursorPosition, getEditorRange, insertHTML} from "./ts/util/selection";
import {afterRenderEvent} from "./ts/wysiwyg/afterRenderEvent";
import {WYSIWYG} from "./ts/wysiwyg/index";
import {input} from "./ts/wysiwyg/input";
import {renderDomByMd} from "./ts/wysiwyg/renderDomByMd";
import {execAfterRender, insertEmptyBlock} from "./ts/util/fixBrowserBehavior";
import {accessLocalStorage} from "./ts/util/compatibility";

class Vditor extends VditorMethod {
    public readonly version: string;
    public vditor: IVditor;
    private isDestroyed = false;

    /**
     * @param id The element or element ID to mount Vditor on.
     * @param options Vditor options
     */
    constructor(id: string | HTMLElement, options?: IOptions) {
        super();
        this.version = VDITOR_VERSION;

        if (typeof id === "string") {
            if (!options) {
                options = {
                    cache: {
                        id: `vditor${id}`,
                    },
                };
            } else if (!options.cache) {
                options.cache = { id: `vditor${id}` };
            } else if (!options.cache.id) {
                options.cache.id = `vditor${id}`;
            }
            if (!document.getElementById(id)) {
                this.showErrorTip(`Failed to get element by id: ${id}`);
                return;
            }
            id = document.getElementById(id);
        }

        const getOptions = new Options(options);
        const mergedOptions = getOptions.merge();

        // Support custom i18n
        if (!mergedOptions.i18n) {
            if (!["de_DE", "en_US", "es_ES", "fr_FR", "ja_JP", "ko_KR", "pt_BR", "ru_RU", "sv_SE", "vi_VN", "zh_CN", "zh_TW"].includes(mergedOptions.lang)) {
                throw new Error(
                    "options.lang error, see https://ld246.com/article/1549638745630#options",
                );
            } else {
                const i18nScriptPrefix = "vditorI18nScript";
                const i18nScriptID = i18nScriptPrefix + mergedOptions.lang;
                document.querySelectorAll(`head script[id^="${i18nScriptPrefix}"]`).forEach((el) => {
                    if (el.id !== i18nScriptID) {
                        document.head.removeChild(el);
                    }
                });
                addScript(`js/i18n/${mergedOptions.lang}.js`, i18nScriptID, mergedOptions.cdn).then(() => {
                    this.init(id as HTMLElement, mergedOptions);
                }).catch(error => {
                    this.showErrorTip(`GET js/i18n/${mergedOptions.lang}.js net::ERR_ABORTED 404 (Not Found)`);
                });
            }
        } else {
            window.VditorI18n = mergedOptions.i18n;
            this.init(id, mergedOptions);
        }
    }

    private showErrorTip(error: string) {
        const tip = new Tip();
        document.body.appendChild(tip.element);
        tip.show(error, 0);
    }

    public updateToolbarConfig(options: IToolbarConfig) {
        this.vditor.toolbar.updateConfig(this.vditor, options);
    }

    /** Set theme */
    public setTheme(
        theme: "dark" | "classic",
        contentTheme?: string,
        codeTheme?: string,
        contentThemePath?: string,
    ) {
        this.vditor.options.theme = theme;
        setTheme(this.vditor);
        if (contentTheme) {
            this.vditor.options.preview.theme.current = contentTheme;
            setContentTheme(contentTheme, contentThemePath || this.vditor.options.preview.theme.path);
        }
        if (codeTheme) {
            this.vditor.options.preview.hljs.style = codeTheme;
            setCodeTheme(codeTheme, this.vditor.options.cdn);
        }
    }

    /** Get Markdown content */
    public getValue() {
        return getMarkdown(this.vditor);
    }

    /** Get current editor mode */
    public getCurrentMode() {
        return this.vditor.currentMode;
    }

    /** Focus editor */
    public focus() {
        if (this.vditor.currentMode === "sv") {
            this.vditor.sv.element.focus();
        } else if (this.vditor.currentMode === "wysiwyg") {
            this.vditor.wysiwyg.element.focus();
        } else if (this.vditor.currentMode === "ir") {
            this.vditor.ir.element.focus();
        }
    }

    /** Blur editor */
    public blur() {
        if (this.vditor.currentMode === "sv") {
            this.vditor.sv.element.blur();
        } else if (this.vditor.currentMode === "wysiwyg") {
            this.vditor.wysiwyg.element.blur();
        } else if (this.vditor.currentMode === "ir") {
            this.vditor.ir.element.blur();
        }
    }

    /** Disable editor */
    public disabled() {
        hidePanel(this.vditor, ["subToolbar", "hint", "popover"]);
        disableToolbar(
            this.vditor.toolbar.elements,
            Constants.EDIT_TOOLBARS.concat(["undo", "redo", "fullscreen", "edit-mode"]),
        );
        this.vditor[this.vditor.currentMode].element.setAttribute(
            "contenteditable",
            "false",
        );
    }

    /** Enable editor */
    public enable() {
        enableToolbar(
            this.vditor.toolbar.elements,
            Constants.EDIT_TOOLBARS.concat(["undo", "redo", "fullscreen", "edit-mode"]),
        );
        this.vditor.undo.resetIcon(this.vditor);
        this.vditor[this.vditor.currentMode].element.setAttribute("contenteditable", "true");
    }

    /** Return selected string */
    public getSelection() {
        if (this.vditor.currentMode === "wysiwyg") {
            return getSelectText(this.vditor.wysiwyg.element);
        } else if (this.vditor.currentMode === "sv") {
            return getSelectText(this.vditor.sv.element);
        } else if (this.vditor.currentMode === "ir") {
            return getSelectText(this.vditor.ir.element);
        }
    }

    /** Set preview content */
    public renderPreview(value?: string) {
        this.vditor.preview.render(this.vditor, value);
    }

    /** Get cursor position */
    public getCursorPosition() {
        return getCursorPosition(this.vditor[this.vditor.currentMode].element);
    }

    /** Is upload in progress */
    public isUploading() {
        return this.vditor.upload.isUploading;
    }

    /** Clear cache */
    public clearCache() {
        if (this.vditor.options.cache.enable && accessLocalStorage()) {
            localStorage.removeItem(this.vditor.options.cache.id);
        }
    }

    /** Disable cache */
    public disabledCache() {
        this.vditor.options.cache.enable = false;
    }

    /** Enable cache */
    public enableCache() {
        if (!this.vditor.options.cache.id) {
            throw new Error(
                "need options.cache.id, see https://ld246.com/article/1549638745630#options",
            );
        }
        this.vditor.options.cache.enable = true;
    }

    /** HTML to Markdown */
    public html2md(value: string) {
        return this.vditor.lute.HTML2Md(value);
    }

    /** Markdown to JSON output */
    public exportJSON(value: string) {
        return this.vditor.lute.RenderJSON(value);
    }

    /** Get HTML */
    public getHTML() {
        return getHTML(this.vditor);
    }

    /** Show message; time=0 means it will be displayed indefinitely */
    public tip(text: string, time?: number) {
        this.vditor.tip.show(text, time);
    }

    /** Set preview mode */
    public setPreviewMode(mode: "both" | "editor") {
        setPreviewMode(mode, this.vditor);
    }

    /** Delete selected content */
    public deleteValue() {
        if (window.getSelection().isCollapsed) {
            return;
        }
        document.execCommand("delete", false);
    }

    /** Update selected content */
    public updateValue(value: string) {
        document.execCommand("insertHTML", false, value);
    }

    /** Insert content at cursor and render Markdown by default */
    public insertValue(value: string, render = true) {
        const range = getEditorRange(this.vditor);
        range.collapse(true);
        // https://github.com/Vanessa219/vditor/issues/716
        // https://github.com/Vanessa219/vditor/issues/917
        const tmpElement = document.createElement("template");
        tmpElement.innerHTML = value;
        range.insertNode(tmpElement.content.cloneNode(true));
        range.collapse(false);
        if (this.vditor.currentMode === "sv") {
            this.vditor.sv.preventInput = true;
            if (render) {
                inputEvent(this.vditor);
            }
        } else if (this.vditor.currentMode === "wysiwyg") {
            // Due to https://github.com/Vanessa219/vditor/issues/1566 cannot use this.vditor.wysiwyg.preventInput = true;
            if (render) {
                input(this.vditor, getSelection().getRangeAt(0));
            }
        } else if (this.vditor.currentMode === "ir") {
            this.vditor.ir.preventInput = true;
            if (render) {
                irInput(this.vditor, getSelection().getRangeAt(0), true);
            }
        }
    }

    /** Insert Markdown at cursor */
    public insertMD(md: string) {
        // https://github.com/Vanessa219/vditor/issues/1640
        if (this.vditor.currentMode === "ir") {
            insertHTML(this.vditor.lute.Md2VditorIRDOM(md), this.vditor);
        } else if (this.vditor.currentMode === "wysiwyg") {
            insertHTML(this.vditor.lute.Md2VditorDOM(md), this.vditor);
        } else {
            processPaste(this.vditor, md);
        }
        this.vditor.outline.render(this.vditor);
        execAfterRender(this.vditor);
    }

    /** Set editor content */
    public setValue(markdown: string, clearStack = false) {
        if (this.vditor.currentMode === "sv") {
            this.vditor.sv.element.innerHTML = `<div data-block='0'>${this.vditor.lute.SpinVditorSVDOM(markdown)}</div>`;
            processSVAfterRender(this.vditor, {
                enableAddUndoStack: true,
                enableHint: false,
                enableInput: false,
            });
        } else if (this.vditor.currentMode === "wysiwyg") {
            renderDomByMd(this.vditor, markdown, {
                enableAddUndoStack: true,
                enableHint: false,
                enableInput: false,
            });
        } else {
            this.vditor.ir.element.innerHTML = this.vditor.lute.Md2VditorIRDOM(markdown);
            this.vditor.ir.element
                .querySelectorAll(".vditor-ir__preview[data-render='2']")
                .forEach((item: HTMLElement) => {
                    processCodeRender(item, this.vditor);
                });
            processAfterRender(this.vditor, {
                enableAddUndoStack: true,
                enableHint: false,
                enableInput: false,
            });
        }

        this.vditor.outline.render(this.vditor);

        if (!markdown) {
            hidePanel(this.vditor, ["emoji", "headings", "submenu", "hint"]);
            if (this.vditor.wysiwyg.popover) {
                this.vditor.wysiwyg.popover.style.display = "none";
            }
            this.clearCache();
        }
        if (clearStack) {
            this.clearStack();
        }
    }

    /** Insert empty block */
    public insertEmptyBlock(position: InsertPosition) {
        insertEmptyBlock(this.vditor, position);
    }

    /** Clear undo & redo stacks */
    public clearStack() {
        this.vditor.undo.clearStack(this.vditor);
        this.vditor.undo.addToUndoStack(this.vditor);
    }

    /** Destroy editor */
    public destroy() {
        this.vditor.element.innerHTML = this.vditor.originalInnerHTML;
        this.vditor.element.classList.remove("vditor");
        this.vditor.element.removeAttribute("style");
        const iconScript = document.getElementById("vditorIconScript");
        if (iconScript) {
            iconScript.remove();
        }
        this.clearCache();

        UIUnbindListener();
        this.vditor.wysiwyg.unbindListener();
        this.vditor.options.after = undefined;
        this.isDestroyed = true;
    }

    /** Get comment IDs */
    public getCommentIds() {
        if (this.vditor.currentMode !== "wysiwyg") {
            return [];
        }
        return this.vditor.wysiwyg.getComments(this.vditor, true);
    }

    /** Highlight comments */
    public hlCommentIds(ids: string[]) {
        if (this.vditor.currentMode !== "wysiwyg") {
            return;
        }
        const hlItem = (item: Element) => {
            item.classList.remove("vditor-comment--hover");
            ids.forEach((id) => {
                if (item.getAttribute("data-cmtids").indexOf(id) > -1) {
                    item.classList.add("vditor-comment--hover");
                }
            });
        };
        this.vditor.wysiwyg.element
            .querySelectorAll(".vditor-comment")
            .forEach((item) => {
                hlItem(item);
            });
        if (this.vditor.preview.element.style.display !== "none") {
            this.vditor.preview.element
                .querySelectorAll(".vditor-comment")
                .forEach((item) => {
                    hlItem(item);
                });
        }
    }

    /** Unhighlight comments */
    public unHlCommentIds(ids: string[]) {
        if (this.vditor.currentMode !== "wysiwyg") {
            return;
        }
        const unHlItem = (item: Element) => {
            ids.forEach((id) => {
                if (item.getAttribute("data-cmtids").indexOf(id) > -1) {
                    item.classList.remove("vditor-comment--hover");
                }
            });
        };
        this.vditor.wysiwyg.element
            .querySelectorAll(".vditor-comment")
            .forEach((item) => {
                unHlItem(item);
            });
        if (this.vditor.preview.element.style.display !== "none") {
            this.vditor.preview.element
                .querySelectorAll(".vditor-comment")
                .forEach((item) => {
                    unHlItem(item);
                });
        }
    }

    /** Remove comments */
    public removeCommentIds(removeIds: string[]) {
        if (this.vditor.currentMode !== "wysiwyg") {
            return;
        }

        const removeItem = (item: Element, removeId: string) => {
            const ids = item.getAttribute("data-cmtids").split(" ");
            ids.find((id, index) => {
                if (id === removeId) {
                    ids.splice(index, 1);
                    return true;
                }
            });
            if (ids.length === 0) {
                item.outerHTML = item.innerHTML;
                getEditorRange(this.vditor).collapse(true);
            } else {
                item.setAttribute("data-cmtids", ids.join(" "));
            }
        };
        removeIds.forEach((removeId) => {
            this.vditor.wysiwyg.element
                .querySelectorAll(".vditor-comment")
                .forEach((item) => {
                    removeItem(item, removeId);
                });
            if (this.vditor.preview.element.style.display !== "none") {
                this.vditor.preview.element
                    .querySelectorAll(".vditor-comment")
                    .forEach((item) => {
                        removeItem(item, removeId);
                    });
            }
        });
        afterRenderEvent(this.vditor, {
            enableAddUndoStack: true,
            enableHint: false,
            enableInput: false,
        });
    }

    private init(id: HTMLElement, mergedOptions: IOptions) {
        if (this.isDestroyed) {
            return;
        }
        this.vditor = {
            currentMode: mergedOptions.mode,
            element: id,
            hint: new Hint(mergedOptions.hint.extend),
            lute: undefined,
            options: mergedOptions,
            originalInnerHTML: id.innerHTML,
            outline: new Outline(window.VditorI18n.outline),
            tip: new Tip(),
        };

        this.vditor.sv = new Editor(this.vditor);
        this.vditor.undo = new Undo();
        this.vditor.wysiwyg = new WYSIWYG(this.vditor);
        this.vditor.ir = new IR(this.vditor);
        this.vditor.toolbar = new Toolbar(this.vditor);

        if (mergedOptions.resize.enable) {
            this.vditor.resize = new Resize(this.vditor);
        }

        if (this.vditor.toolbar.elements.devtools) {
            this.vditor.devtools = new DevTools();
        }

        if (mergedOptions.upload.url || mergedOptions.upload.handler) {
            this.vditor.upload = new Upload();
        }

        addScript(
            mergedOptions._lutePath ||
            `js/lute/lute.min.js`,
            "vditorLuteScript",
            mergedOptions.cdn,
        ).then(() => {
            this.vditor.lute = setLute({
                autoSpace: this.vditor.options.preview.markdown.autoSpace,
                gfmAutoLink: this.vditor.options.preview.markdown.gfmAutoLink,
                codeBlockPreview: this.vditor.options.preview.markdown
                    .codeBlockPreview,
                emojiSite: this.vditor.options.hint.emojiPath,
                emojis: this.vditor.options.hint.emoji,
                fixTermTypo: this.vditor.options.preview.markdown.fixTermTypo,
                footnotes: this.vditor.options.preview.markdown.footnotes,
                headingAnchor: false,
                inlineMathDigit: this.vditor.options.preview.math.inlineDigit,
                linkBase: this.vditor.options.preview.markdown.linkBase,
                linkPrefix: this.vditor.options.preview.markdown.linkPrefix,
                listStyle: this.vditor.options.preview.markdown.listStyle,
                mark: this.vditor.options.preview.markdown.mark,
                mathBlockPreview: this.vditor.options.preview.markdown
                    .mathBlockPreview,
                paragraphBeginningSpace: this.vditor.options.preview.markdown
                    .paragraphBeginningSpace,
                sanitize: this.vditor.options.preview.markdown.sanitize,
                sub: this.vditor.options.preview.markdown.sub,
                sup: this.vditor.options.preview.markdown.sup,
                toc: this.vditor.options.preview.markdown.toc,
            });

            this.vditor.preview = new Preview(this.vditor);

            initUI(this.vditor);

            if (mergedOptions.after) {
                mergedOptions.after();
            }
            if (mergedOptions.icon) {
                // Prevent loading 2 times when initializing 2 editors
                addScriptSync(`js/icons/${mergedOptions.icon}.js`, "vditorIconScript", mergedOptions.cdn);
            }
        });
    }
}

export default Vditor;
