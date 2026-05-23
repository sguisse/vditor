import {Constants} from "../constants";

export const addStyle = (path: string, id: string, basePath = Constants.CDN) => {
    if (!document.getElementById(id)) {
        let url = path;
        if (!/^(https?:)?\/\//.test(path)) {
            url = (basePath ? `${basePath}/${path}` : path).replace(/\/+/g, "/");
        }
        const styleElement = document.createElement("link");
        styleElement.id = id;
        styleElement.rel = "stylesheet";
        styleElement.type = "text/css";
        styleElement.href = url;
        document.getElementsByTagName("head")[0].appendChild(styleElement);
    }
};
