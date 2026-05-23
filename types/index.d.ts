declare module "*.svg";

declare module "*.png";

type TWYSISYGToolbar =
    "table"
    | "code-block"
    | "heading"
    | "link-ref"
    | "a"
    | "image"
    | "footnotes-block"
    | "footnotes-ref"
    | "vditor-toc"
    | "blockquote"
    | "li"
    | "block"

interface Window {
    VditorI18n: ITips;
    hljs: {
        listLanguages(): string[];
        highlight(text: string, options: {
            language?: string,
            ignoreIllegals: boolean
        }): {
            value: string
        };
        getLanguage(text: string): {
            name: string
        };
    };
}

interface IObject {
    [key: string]: string;
}

interface ILuteNode {
    TokensStr: () => string;
    __internal_object__: {
        Parent: {
            Type: number,
        },
        HeadingLevel: string,
    };
}

type ILuteRenderCallback = (node: ILuteNode, entering: boolean) => [string, number];

/** @link https://ld246.com/article/1588412297062 */
interface ILuteRender {
    renderDocument?: ILuteRenderCallback;
    renderParagraph?: ILuteRenderCallback;
    renderText?: ILuteRenderCallback;
    renderCodeBlock?: ILuteRenderCallback;
    renderCodeBlockOpenMarker?: ILuteRenderCallback;
    renderCodeBlockInfoMarker?: ILuteRenderCallback;
    renderCodeBlockCode?: ILuteRenderCallback;
    renderCodeBlockCloseMarker?: ILuteRenderCallback;
    renderMathBlock?: ILuteRenderCallback;
    renderMathBlockOpenMarker?: ILuteRenderCallback;
    renderMathBlockContent?: ILuteRenderCallback;
    renderMathBlockCloseMarker?: ILuteRenderCallback;
    renderBlockquote?: ILuteRenderCallback;
    renderBlockquoteMarker?: ILuteRenderCallback;
    renderHeading?: ILuteRenderCallback;
    renderHeadingC8hMarker?: ILuteRenderCallback;
    renderList?: ILuteRenderCallback;
    renderListItem?: ILuteRenderCallback;
    renderTaskListItemMarker?: ILuteRenderCallback;
    renderThematicBreak?: ILuteRenderCallback;
    renderHTML?: ILuteRenderCallback;
    renderTable?: ILuteRenderCallback;
    renderTableHead?: ILuteRenderCallback;
    renderTableRow?: ILuteRenderCallback;
    renderTableCell?: ILuteRenderCallback;
    renderFootnotesDef?: ILuteRenderCallback;
    renderCodeSpan?: ILuteRenderCallback;
    renderCodeSpanOpenMarker?: ILuteRenderCallback;
    renderCodeSpanContent?: ILuteRenderCallback;
    renderCodeSpanCloseMarker?: ILuteRenderCallback;
    renderInlineMath?: ILuteRenderCallback;
    renderInlineMathOpenMarker?: ILuteRenderCallback;
    renderInlineMathContent?: ILuteRenderCallback;
    renderInlineMathCloseMarker?: ILuteRenderCallback;
    renderEmphasis?: ILuteRenderCallback;
    renderEmAsteriskOpenMarker?: ILuteRenderCallback;
    renderEmAsteriskCloseMarker?: ILuteRenderCallback;
    renderEmUnderscoreOpenMarker?: ILuteRenderCallback;
    renderEmUnderscoreCloseMarker?: ILuteRenderCallback;
    renderStrong?: ILuteRenderCallback;
    renderStrongA6kOpenMarker?: ILuteRenderCallback;
    renderStrongA6kCloseMarker?: ILuteRenderCallback;
    renderStrongU8eOpenMarker?: ILuteRenderCallback;
    renderStrongU8eCloseMarker?: ILuteRenderCallback;
    renderStrikethrough?: ILuteRenderCallback;
    renderStrikethrough1OpenMarker?: ILuteRenderCallback;
    renderStrikethrough1CloseMarker?: ILuteRenderCallback;
    renderStrikethrough2OpenMarker?: ILuteRenderCallback;
    renderStrikethrough2CloseMarker?: ILuteRenderCallback;
    renderHardBreak?: ILuteRenderCallback;
    renderSoftBreak?: ILuteRenderCallback;
    renderInlineHTML?: ILuteRenderCallback;
    renderLink?: ILuteRenderCallback;
    renderOpenBracket?: ILuteRenderCallback;
    renderCloseBracket?: ILuteRenderCallback;
    renderOpenParen?: ILuteRenderCallback;
    renderCloseParen?: ILuteRenderCallback;
    renderLinkText?: ILuteRenderCallback;
    renderLinkSpace?: ILuteRenderCallback;
    renderLinkDest?: ILuteRenderCallback;
    renderLinkTitle?: ILuteRenderCallback;
    renderImage?: ILuteRenderCallback;
    renderBang?: ILuteRenderCallback;
    renderEmoji?: ILuteRenderCallback;
    renderEmojiUnicode?: ILuteRenderCallback;
    renderEmojiImg?: ILuteRenderCallback;
    renderEmojiAlias?: ILuteRenderCallback;
    renderToC?: ILuteRenderCallback;
    renderFootnotesRef?: ILuteRenderCallback;
    renderBackslash?: ILuteRenderCallback;
    renderBackslashContent?: ILuteRenderCallback;
}

interface ILuteOptions extends IMarkdownConfig {
    emojis: IObject;
    emojiSite: string;
    headingAnchor: boolean;
    inlineMathDigit: boolean;
    lazyLoadImage?: string;
}

declare class Lute {
    public static WalkStop: number;
    public static WalkSkipChildren: number;
    public static WalkContinue: number;
    public static Version: string;
    public static Caret: string;

    public static New(): Lute;

    public static EscapeHTMLStr(html: string): string;

    public static GetHeadingID(node: ILuteNode): string;

    public static NewNodeID(): string;

    public static Sanitize(html: string): string;

    private constructor();

    public SetJSRenderers(options?: {
        renderers: {
            HTML2VditorDOM?: ILuteRender,
            HTML2VditorIRDOM?: ILuteRender,
            HTML2Md?: ILuteRender,
            Md2HTML?: ILuteRender,
            Md2VditorDOM?: ILuteRender,
            Md2VditorIRDOM?: ILuteRender,
            Md2VditorSVDOM?: ILuteRender,
        },
    }): void;

    public SetChineseParagraphBeginningSpace(enable: boolean): void;

    public SetHeadingID(enable: boolean): void;

    public SetRenderListStyle(enable: boolean): void;

    public SetLinkBase(url: string): void;

    public SetVditorIR(enable: boolean): void;

    public SetVditorSV(enable: boolean): void;

    public SetVditorWYSIWYG(enable: boolean): void;

    public SetLinkPrefix(url: string): void;

    public SetMark(enable: boolean): void;

    public SetGFMAutoLink(enable: boolean): void;

    public SetSanitize(enable: boolean): void;

    public SetHeadingAnchor(enable: boolean): void;

    public SetImageLazyLoading(imagePath: string): void;

    public SetInlineMathAllowDigitAfterOpenMarker(enable: boolean): void;

    public SetToC(enable: boolean): void;

    public SetFootnotes(enable: boolean): void;

    public SetAutoSpace(enable: boolean): void;

    public SetFixTermTypo(enable: boolean): void;

    public SetEmojiSite(emojiSite: string): void;

    public SetVditorCodeBlockPreview(enable: boolean): void;

    public SetVditorMathBlockPreview(enable: boolean): void;

    public SetSub(enable: boolean): void;

    public SetSup(enable: boolean): void;

    public PutEmojis(emojis: IObject): void;

    public GetEmojis(): IObject;

    public IsValidLinkDest(link: string): boolean;

    // debugger md
    public RenderEChartsJSON(text: string): string;

    // Convert markdown to HTML
    public Md2HTML(markdown: string): string;

    // Convert HTML to markdown when pasting
    public HTML2Md(html: string): string;

    // Convert wysiwyg to HTML
    public VditorDOM2HTML(vhtml: string): string;

    // WYSIWYG input rendering
    public SpinVditorDOM(html: string): string;

    // Convert HTML to WYSIWYG when pasting
    public HTML2VditorDOM(html: string): string;

    // Convert WYSIWYG to markdown
    public VditorDOM2Md(html: string): string;

    // Convert markdown to WYSIWYG
    public Md2VditorDOM(markdown: string): string;

    // IR input rendering
    public SpinVditorIRDOM(markdown: string): string;

    // Get markdown from IR
    public VditorIRDOM2Md(html: string): string;

    // Convert markdown to IR
    public Md2VditorIRDOM(text: string): string;

    // Get HTML
    public VditorIRDOM2HTML(html: string): string;

    // Convert HTML to SV when pasting
    public HTML2VditorIRDOM(html: string): string;

    // SV input rendering
    public SpinVditorSVDOM(text: string): string;

    // Convert markdown to SV when pasting
    public Md2VditorSVDOM(text: string): string;

    // Render markdown to JSON structure https://github.com/88250/lute/issues/120
    public RenderJSON(markdown: string): string;
}

declare const webkitAudioContext: {
    prototype: AudioContext
    new(contextOptions?: AudioContextOptions): AudioContext,
};

interface ITips {
    [index: string]: string;

    alignCenter: string;
    alignLeft: string;
    alignRight: string;
    alternateText: string;
    bold: string;
    both: string;
    check: string;
    close: string;
    code: string;
    "code-theme": string;
    column: string;
    comment: string;
    confirm: string;
    "content-theme": string;
    copied: string;
    copy: string;
    "delete-column": string;
    "delete-row": string;
    devtools: string;
    down: string;
    downloadTip: string;
    edit: string;
    "edit-mode": string;
    emoji: string;
    export: string;
    fileTypeError: string;
    footnoteRef: string;
    fullscreen: string;
    generate: string;
    headings: string;
    help: string;
    imageURL: string;
    indent: string;
    info: string;
    "inline-code": string;
    "insert-after": string;
    "insert-before": string;
    insertColumnLeft: string;
    insertColumnRight: string;
    insertRowAbove: string;
    insertRowBelow: string;
    instantRendering: string;
    italic: string;
    language: string;
    line: string;
    link: string;
    linkRef: string;
    list: string;
    more: string;
    nameEmpty: string;
    "ordered-list": string;
    outdent: string;
    outline: string;
    over: string;
    performanceTip: string;
    preview: string;
    quote: string;
    record: string;
    "record-tip": string;
    recording: string;
    redo: string;
    remove: string;
    row: string;
    spin: string;
    splitView: string;
    strike: string;
    table: string;
    textIsNotEmpty: string;
    title: string;
    tooltipText: string;
    undo: string;
    up: string;
    update: string;
    upload: string;
    uploadError: string;
    uploading: string;
    wysiwyg: string;
}

interface II18n {
    de_DE: ITips;
    en_US: ITips;
    es_ES: ITips;
    fr_FR: ITips;
    ja_JP: ITips;
    ko_KR: ITips;
    pt_BR: ITips;
    ru_RU: ITips;
    sv_SE: ITips;
    vi_VN: ITips;
    zh_CN: ITips;
    zh_TW: ITips;
}

interface IClasses {
    preview?: string;
}

interface IPreviewTheme {
    current: string;
    list?: IObject;
    path?: string;
}

/** @link https://ld246.com/article/1549638745630#options-upload */
interface IUpload {
    /** Upload URL */
    url?: string;
    /** Max upload file size in bytes */
    max?: number;
    /** When clipboard contains image URLs, use this URL to re-upload */
    linkToImgUrl?: string;

    /** Custom renderer when clipboard contains image URLs */
    renderLinkDest?(vditor: IVditor, node: ILuteNode, entering: boolean): [string, number];

    /** CORS upload token header: X-Upload-Token */
    token?: string;
    /** Accepted file types, same as input accept */
    accept?: string;
    /** WithCredentials for cross-site requests. Default: false */
    withCredentials?: boolean;
    /** Request headers */
    headers?: IObject;
    /** Extra request parameters */
    extraData?: {[key: string]: string | Blob};
    /** Allow multiple file upload. Default: true */
    multiple?: boolean;
    /** Upload field name. Default: file[] */
    fieldName?: string;

    /** Function to set headers before each upload */
    setHeaders?(): IObject;

    /** Upload success callback */
    success?(editor: HTMLPreElement, msg: string): void;

    /** Upload failure callback */
    error?(msg: string): void;

    /** Filename sanitizer. Default: name => name.replace(/\W/g, '') */
    filename?(name: string): string;

    /** Validation: return true on success, otherwise return an error message */
    validate?(files: File[]): string | boolean;

    /** Custom upload handler: return error message on failure */
    handler?(files: File[]): string | null | Promise<string> | Promise<null>;

    // Upload a dataUrl to the server and return the accessible URL
    handleDataUrl?(dataUrl: string): string | Promise<string>;

    /** Convert image base64 to a link */
    base64ToLink?(responseText: string): string;

    /** Transform server response data to match the built-in format */
    format?(files: File[], responseText: string): string;

    /** Transform server response data for linkToImgUrl to match the built-in format */
    linkToImgFormat?(responseText: string): string;

    /** Process uploaded files before returning */
    file?(files: File[]): File[] | Promise<File[]>;

    /** Cancel files that are being uploaded */
    cancel?(files: File[]): void;

    /** Callback after image URL upload */
    linkToImgCallback?(responseText: string): void;
}

/** @link https://ld246.com/article/1549638745630#options-toolbar */
interface IMenuItem {
    /** Unique identifier */
    name: string;
    /** SVG icon HTML */
    icon?: string;
    /** Element class name */
    className?: string;
    /** Tooltip */
    tip?: string;
    /** Hotkey, supports ⌘/ctrl or ⌘/ctrl-⇧/shift formats; not supported in WYSIWYG mode */
    hotkey?: string;
    /** Suffix inserted into the editor */
    suffix?: string;
    /** Prefix inserted into the editor */
    prefix?: string;
    /** Tooltip position: ne, nw */
    tipPosition?: string;
    /** Submenu */
    toolbar?: Array<string | IMenuItem>;
    /** Menu level (max 3), for internal use */
    level?: number;

    /** Event triggered when a custom button is clicked */
    click?(event: Event, vditor: IVditor): void;
}

/** @link https://ld246.com/article/1549638745630#options-preview-hljs */
interface IHljs {
    /** Default language when code block has no language specified. Default: "" */
    defaultLang?: string;
    /** Enable line numbers. Default: false */
    lineNumber?: boolean;
    /** Code style, available values: see [Chroma](https://xyproto.github.io/splash/docs/longer/all.html). Default: 'github' */
    style?: string;
    /** Enable code highlighting. Default: true */
    enable?: boolean;
    /** Custom specified languages: CODE_LANGUAGES */
    langs?: string[];

    /** Render menu button at the top-right */
    renderMenu?(element: HTMLElement, menuElement: HTMLElement): void;
}

/** @link https://ld246.com/article/1549638745630#options-preview-math */
interface IMath {
    /** Allow digits immediately after inline math opening $ marker. Default: false */
    inlineDigit?: boolean;
    /** Macros passed when using MathJax. Default: {} */
    macros?: object;
    /** Math rendering engine. Default: 'KaTeX' */
    engine?: "KaTeX" | "MathJax";
    /** Options to pass when using MathJax as the rendering engine */
    mathJaxOptions?: any;
}

/** @link https://ld246.com/article/1549638745630#options-preview-markdown */
interface IMarkdownConfig {
    /** Automatic spacing. Default: false */
    autoSpace?: boolean;
    /** Insert two spaces at paragraph beginning. Default: false */
    paragraphBeginningSpace?: boolean;
    /** Auto-correct terms. Default: false */
    fixTermTypo?: boolean;
    /** Insert table of contents. Default: false */
    toc?: boolean;
    /** Footnotes. Default: true */
    footnotes?: boolean;
    /** Render code blocks in WYSIWYG & IR modes. Default: true */
    codeBlockPreview?: boolean;
    /** Render math blocks in WYSIWYG & IR modes. Default: true */
    mathBlockPreview?: boolean;
    /** Enable XSS sanitization. Default: true */
    sanitize?: boolean;
    /** Link relative path prefix. Default: '' */
    linkBase?: string;
    /** Link forced prefix. Default: '' */
    linkPrefix?: string;
    /** Add markers to lists for custom list styles. Default: false */
    listStyle?: boolean;
    /** Support for mark syntax */
    mark?: boolean;
    /** Support automatic links */
    gfmAutoLink?: boolean;
    /** Support superscript */
    sup?: boolean;
    /** Support subscript */
    sub?: boolean;
}

/** @link https://ld246.com/article/1549638745630#options-preview */
interface IPreview {
    /** Preview debounce interval in milliseconds. Default: 1000 */
    delay?: number;
    /** Preview maximum width in pixels. Default: 768 */
    maxWidth?: number;
    /** Display mode. Default: 'both' */
    mode?: "both" | "editor";
    /** Markdown parsing request URL */
    url?: string;
    /** @link https://ld246.com/article/1549638745630#options-preview-hljs */
    hljs?: IHljs;
    /** @link https://ld246.com/article/1549638745630#options-preview-math */
    math?: IMath;
    /** @link https://ld246.com/article/1549638745630#options-preview-markdown */
    markdown?: IMarkdownConfig;
    /** @link https://ld246.com/article/1549638745630#options-preview-theme */
    theme?: IPreviewTheme;
    /** @link https://ld246.com/article/1549638745630#options-preview-actions  */
    actions?: Array<IPreviewAction | IPreviewActionCustom>;
    render?: IPreviewRender;

    /** Preview callback */
    parse?(element: HTMLElement): void;

    /** Callback before rendering (transform HTML) */
    transform?(html: string): string;
}

interface IPreviewRender {
    media?: {
        enable?: boolean;
    };
}

type IPreviewAction = "desktop" | "tablet" | "mobile" | "mp-wechat" | "zhihu";

interface IPreviewActionCustom {
    /**Key name */
    key: string;
    /**Button text */
    text: string;
    /**Button className value */
    className?: string;
    /** Button prompt information */
    tooltip?: string;
    /** Click callback */
    click: (key: string) => void;
}

interface IRenderersCDN {
    mermaid?: { cdn?: string };
    math?: { cdn?: string };
    echarts?: { cdn?: string };
    chart?: { cdn?: string };
    mindmap?: { cdn?: string };
    abc?: { cdn?: string };
    graphviz?: { cdn?: string };
    flowchart?: { cdn?: string };
    plantuml?: { cdn?: string };
    markmap?: { cdn?: string };
    smiles?: { cdn?: string };
    highlight?: { cdn?: string };
}

interface IPreviewOptions {
    mode: "dark" | "light";
    customEmoji?: IObject;
    lang?: (keyof II18n);
    i18n?: ITips;
    lazyLoadImage?: string;
    emojiPath?: string;
    hljs?: IHljs;
    speech?: {
        enable?: boolean,
    };
    anchor?: number; // 0: no render, 1: render left, 2: render right
    math?: IMath;
    cdn?: string;
    renderersCDN?: IRenderersCDN;
    markdown?: IMarkdownConfig;
    renderers?: ILuteRender;
    theme?: IPreviewTheme;
    icon?: "ant" | "material" | undefined;
    render?: IPreviewRender;

    transform?(html: string): string;

    after?(): void;
}

interface IHintData {
    html: string;
    value: string;
}

interface IHintExtend {
    key: string;

    hint?(value: string): IHintData[] | Promise<IHintData[]>;
}

/** @link https://ld246.com/article/1549638745630#options-hint */
interface IHint {
    /** Prompt content whether to perform md analysis */
    parse?: boolean;
    /** Commonly used emoticon tips HTML */
    emojiTail?: string;
    /** Hint debounce millisecond interval. Default value: 200 */
    delay?: number;
    /** The default expression can be selected from [lute/emoji_map](https://github.com/88250/lute/blob/master/parse/emoji_map.go#L32) or customized*/
    emoji?: IObject;
    /** Emoticon picture address. default value: 'https://unpkg.com/vditor@${VDITOR_VERSION}/dist/images/emoji' */
    emojiPath?: string;
    extend?: IHintExtend[];
}

/** @link https://ld246.com/article/1549638745630#options-toolbarConfig */
interface IToolbarConfig {
    /** Whether to hide the toolbar. default value: false */
    hide?: boolean;
    /** Whether to pin the toolbar. default value: false */
    pin?: boolean;
}

/** @link https://ld246.com/article/1549638745630#options-comment */
interface IComment {
    /** Whether to enable comment mode. default value: false */
    enable: boolean;

    /** Add comment callback */
    add?(id: string, text: string, commentsData: ICommentsData[]): void;

    /** Delete comment callback */
    remove?(ids: string[]): void;

    /** scroll callback */
    scroll?(top: number): void;

    /** When the document is modified, adapt the comment height */
    adjustTop?(commentsData: ICommentsData[]): void;
}

/** @link https://ld246.com/article/1549638745630#options-outline */
interface IOutline {
    /** Initialize whether to display the outline. default value: false */
    enable: boolean;
    /** Outline position: 'left', 'right'. default value: 'left' */
    position: "left" | "right";
}

interface IResize {
    position?: string;
    enable?: boolean;

    after?(height: number): void;
}

/** @link https://ld246.com/article/1549638745630#options */
interface IOptions {
    /** RTL */
    rtl?: boolean;
    /** history interval */
    undoDelay?: number;
    /** Used during internal debugging */
    _lutePath?: string;
    /** Editor initialization value. default value: '' */
    value?: string;
    /** Whether to display the log. default value: false */
    debugger?: boolean;
    /** Whether to enable typewriter mode. default value: false */
    typewriterMode?: boolean;
    /** The total height of the editor. default value: 'auto' */
    height?: number | string;
    /** Editor minimum height */
    minHeight?: number;
    /** The total editor width, supports %. Default value: 'auto' */
    width?: number | string;
    /** Prompt when the input area is empty. default value: '' */
    placeholder?: string;
    /** Multilingual. default value: 'zh_CN' */
    lang?: (keyof II18n);
    /** Internationalization, custom languages. Priority lower than lang */
    i18n?: ITips;
    /** @link https://ld246.com/article/1549638745630#options-fullscreen */
    fullscreen?: {
        /** Full screen level. default value: 90 */
        index: number;
    };
    /** @link https://ld246.com/article/1549638745630#options-toolbar */
    toolbar?: Array<string | IMenuItem>;
    /** @link https://ld246.com/article/1549638745630#options-resize */
    resize?: IResize;
    /** @link https://ld246.com/article/1549638745630#options-counter */
    counter?: {
        /** Enable counter. Default: false */
        enable: boolean;
        /** Maximum allowed input */
        max?: number;
        /** Counter type. Default: 'markdown' */
        type?: "markdown" | "text";
        /** Word/character count callback. */
        after?(length: number, counter: {
            /** Enable counter. Default: false */
            enable: boolean;
            /** Maximum allowed input */
            max?: number;
            /** Counter type. Default: 'markdown' */
            type?: "markdown" | "text"
        }): void
    };
    /** @link https://ld246.com/article/1549638745630#options-cache */
    cache?: {
        /** Cache key; required when the first parameter is an element and caching is enabled */
        id?: string;
        /** Use localStorage for caching. Default: true */
        enable?: boolean;
        /** Callback after caching */
        after?(markdown: string): void;
    };
    /** Editor mode. Default: 'wysiwyg'
     *
     * wysiwyg: WYSIWYG
     *
     * ir: Instant rendering
     *
     * sv: Split view preview
     */
    mode?: "wysiwyg" | "sv" | "ir";
    /** @link https://ld246.com/article/1549638745630#options-preview */
    preview?: IPreview;
    /** @link https://ld246.com/article/1549638745630#options-link */
    link?: {
        /** Open links by default. Default: true */
        isOpen?: boolean;
        /** Link click event */
        click?: (bom: Element) => void;
    },
    /** @link https://ld246.com/article/1549638745630#options-image */
    image?: {
        /** Preview images. Default: true */
        isPreview?: boolean;
        /** Image preview handler */
        preview?: (bom: Element) => void;
    },
    /** @link https://ld246.com/article/1549638745630#options-hint */
    hint?: IHint;
    /** @link https://ld246.com/article/1549638745630#options-toolbarConfig */
    toolbarConfig?: IToolbarConfig;
    /** Comment options
     * @link https://ld246.com/article/1549638745630#options-comment
     */
    comment?: IComment;
    /** Theme. Default: 'classic' */
    theme?: "classic" | "dark";
    /** Icon pack. Default: 'ant' */
    icon?: "ant" | "material";
    /** @link https://ld246.com/article/1549638745630#options-upload */
    upload?: IUpload;
    /** @link https://ld246.com/article/1549638745630#options-classes */
    classes?: IClasses;
    /** Configure custom CDN URL. Default: 'https://unpkg.com/vditor@${VDITOR_VERSION}' */
    cdn?: string;
    /** Configure CDN URLs for various renderers */
    renderersCDN?: IRenderersCDN;
    /** Tab key operation string; supports \t or any string */
    tab?: string;
    /** @link https://ld246.com/article/1549638745630#options-outline */
    outline?: IOutline;
    customRenders?: {
        language: string,
        render: (element: HTMLElement, vditor: IVditor) => void
    }[],

    /** Callback after editor async rendering completes */
    after?(): void;

    /** Triggered after input */
    input?(value: string): void;

    /** Triggered after focus */
    focus?(value: string): void;

    /** Triggered after blur */
    blur?(value: string): void;

    /** Triggered on keydown */
    keydown?(event: KeyboardEvent): void;

    /** Triggered when `esc` is pressed */
    esc?(value: string): void;

    /** Triggered when `⌘/ctrl+enter` is pressed */
    ctrlEnter?(value: string): void;

    /** Triggered after selecting text in the editor */
    select?(value: string): void;

    /** Triggered when no text is selected */
    unSelect?(): void;

    /** Customize WYSIWYG toolbar */
    customWysiwygToolbar?(type: TWYSISYGToolbar, element: HTMLElement): void
}

interface IEChart {
    setOption(option: any): void;

    resize(): void;
}

interface IVditor {
    element: HTMLElement;
    options: IOptions;
    originalInnerHTML: string;
    lute: Lute;
    currentMode: "sv" | "wysiwyg" | "ir";
    devtools?: {
        element: HTMLDivElement,
        renderEchart(vditor: IVditor): void,
    };
    outline: {
        element: HTMLElement,
        render(vditor: IVditor): string,
        toggle(vditor: IVditor, show?: boolean, focus?: boolean): void,
    };
    toolbar?: {
        elements?: {[key: string]: HTMLElement},
        element?: HTMLElement,
        updateConfig(vditor: IVditor, options: IToolbarConfig): void,
    };
    preview?: {
        element: HTMLElement,
        previewElement: HTMLElement,
        render(vditor: IVditor, value?: string): void,
    };
    counter?: {
        element: HTMLElement
        render(vditor: IVditor, mdText?: string): void,
    };
    resize?: {
        element: HTMLElement,
    };
    hint: {
        timeId: number
        element: HTMLDivElement
        recentLanguage: string
        fillEmoji(element: HTMLElement, vditor: IVditor): void
        render(vditor: IVditor): void,
        genHTML(data: IHintData[], key: string, vditor: IVditor): void
        select(event: KeyboardEvent, vditor: IVditor): boolean,
    };
    tip: {
        element: HTMLElement
        show(text: string, time?: number): void
        hide(): void,
    };
    upload?: {
        element: HTMLElement
        isUploading: boolean
        range: Range,
        xhr?: XMLHttpRequest,
    };
    undo?: {
        clearStack(vditor: IVditor): void,
        redo(vditor: IVditor): void
        undo(vditor: IVditor): void
        addToUndoStack(vditor: IVditor): void
        recordFirstPosition(vditor: IVditor, event: KeyboardEvent): void,
        resetIcon(vditor: IVditor): void,
    };
    wysiwyg?: {
        range: Range,
        element: HTMLPreElement,
        selectPopover: HTMLDivElement,
        popover: HTMLDivElement,
        afterRenderTimeoutId: number,
        hlToolbarTimeoutId: number,
        preventInput: boolean,
        composingLock: boolean,
        commentIds: string[]
        getComments(vditor: IVditor, getData?: boolean): ICommentsData[],
        triggerRemoveComment(vditor: IVditor): void,
        showComment(): void,
        hideComment(): void,
        unbindListener(): void,
    };
    ir?: {
        range: Range,
        element: HTMLPreElement,
        composingLock: boolean,
        preventInput: boolean,
        processTimeoutId: number,
        hlToolbarTimeoutId: number,
    };
    sv?: {
        range: Range,
        element: HTMLPreElement,
        processTimeoutId: number,
        hlToolbarTimeoutId: number,
        composingLock: boolean,
        preventInput: boolean,
    };
}

interface ICommentsData {
    id: string;
    top: number;
}
