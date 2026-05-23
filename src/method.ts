import {abcRender} from "./ts/markdown/abcRender";
import * as adapterRender from "./ts/markdown/adapterRender";
import {chartRender} from "./ts/markdown/chartRender";
import {codeRender} from "./ts/markdown/codeRender";
import {flowchartRender} from "./ts/markdown/flowchartRender";
import {graphvizRender} from "./ts/markdown/graphvizRender";
import {highlightRender} from "./ts/markdown/highlightRender";
import {lazyLoadImageRender} from "./ts/markdown/lazyLoadImageRender";
import {mathRender} from "./ts/markdown/mathRender";
import {mediaRender} from "./ts/markdown/mediaRender";
import {mermaidRender} from "./ts/markdown/mermaidRender";
import {SMILESRender} from "./ts/markdown/SMILESRender";
import {markmapRender} from "./ts/markdown/markmapRender";
import {mindmapRender} from "./ts/markdown/mindmapRender";
import {outlineRender} from "./ts/markdown/outlineRender";
import {plantumlRender} from "./ts/markdown/plantumlRender";
import {md2html, previewRender} from "./ts/markdown/previewRender";
import {speechRender} from "./ts/markdown/speechRender";
import {previewImage} from "./ts/preview/image";
import {setCodeTheme} from "./ts/ui/setCodeTheme";
import {setContentTheme} from "./ts/ui/setContentTheme";

class Vditor {

    /** Click image to enlarge */
    public static adapterRender = adapterRender;
    /** Click image to enlarge */
    public static previewImage = previewImage;
    /** Add copy button to code blocks within element */
    public static codeRender = codeRender;
    /** Render graphviz */
    public static graphvizRender = graphvizRender;
    /** Render syntax highlighting for code blocks within element */
    public static highlightRender = highlightRender;
    /** Render mathematical formulas */
    public static mathRender = mathRender;
    /** Render flowchart, sequence, and Gantt diagrams */
    public static mermaidRender = mermaidRender;
    /** Render chemical structures */
    public static SMILESRender = SMILESRender;
    /** Mindmap rendering from Markdown */
    public static markmapRender = markmapRender;
    /** Render using flowchart.js */
    public static flowchartRender = flowchartRender;
    /** Chart rendering */
    public static chartRender = chartRender;
    /** Music staff rendering (ABC notation) */
    public static abcRender = abcRender;
    /** Mindmap rendering */
    public static mindmapRender = mindmapRender;
    /** PlantUML rendering */
    public static plantumlRender = plantumlRender;
    /** Outline rendering */
    public static outlineRender = outlineRender;
    /** Render [specific links](https://github.com/Vanessa219/vditor/issues/7) as video, audio, or embedded iframe respectively */
    public static mediaRender = mediaRender;
    /** Read selected text */
    public static speechRender = speechRender;
    /** Lazy-load images */
    public static lazyLoadImageRender = lazyLoadImageRender;
    /** Convert Markdown text to HTML; this method uses asynchronous programming */
    public static md2html = md2html;
    /** Render page Markdown articles */
    public static preview = previewRender;
    /** Set code theme */
    public static setCodeTheme = setCodeTheme;
    /** Set content theme */
    public static setContentTheme = setContentTheme;
}

export default Vditor;
