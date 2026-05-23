import {Constants} from "../constants";

export const addScriptSync = (path: string, id: string, basePath = Constants.CDN) => {
    if (document.getElementById(id)) {
        return false;
    }
    let url = path;
    if (!/^(https?:)?\/\//.test(path)) {
        url = (basePath ? `${basePath}/${path}` : path).replace(/\/+/g, "/");
    }
    const xhrObj = new XMLHttpRequest();
    xhrObj.open("GET", url, false);
    xhrObj.setRequestHeader("Accept",
        "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01");
    xhrObj.send("");
    const scriptElement = document.createElement("script");
    scriptElement.type = "text/javascript";
    scriptElement.text = xhrObj.responseText;
    scriptElement.id = id;
    document.head.appendChild(scriptElement);
};

export const addScript = (path: string, id: string, basePath = Constants.CDN) => {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
            // If the script is already loaded, return immediately
            resolve(true);
            return false;
        }
        let url = path;
        if (!/^(https?:)?\/\//.test(path)) {
            url = (basePath ? `${basePath}/${path}` : path).replace(/\/+/g, "/");
        }
        const scriptElement = document.createElement("script");
        scriptElement.src = url;
        scriptElement.async = true;
        // When called repeatedly, Chrome won't re-request the same JS
        document.head.appendChild(scriptElement);
        scriptElement.onerror = (event) => {
            reject(event);
        };
        scriptElement.onload = () => {
            if (document.getElementById(id)) {
                // For repeated calls, remove the temporary script tag from the DOM
                scriptElement.remove();
                resolve(true);
                return false;
            }
            scriptElement.id = id;
            resolve(true);
        };
    });
};
