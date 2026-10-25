import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { convertToExcalidrawElements, Excalidraw } from "@excalidraw/excalidraw";

const h = React.createElement;
let activeRoot;
let activeContainer;

function getResearchKey(item) {
    return item.id || `${item.groupId || item.groupTitle || ""}|${item.title || ""}|${item.createdAt || item.sourceUrl || ""}`;
}

function createSourceElements(map, items, startIndex = 0) {
    const skeletons = items.map((item, index) => {
        const position = startIndex + index;
        const title = item.title || item.groupTitle || "Untitled research";
        const connection = map.connections?.[getResearchKey(item)];
        const description = connection?.text ? `\n\n${connection.text}` : "";
        return {
            type: "rectangle",
            x: 80 + (position % 3) * 300,
            y: 160 + Math.floor(position / 3) * 190,
            width: 250,
            height: 130,
            backgroundColor: "#1e3a8a",
            strokeColor: "#818cf8",
            label: { text: `${title}${description}`, fontSize: 16, fontFamily: 2 }
        };
    });
    const converted = convertToExcalidrawElements(skeletons);
    const sourceShapes = converted.filter((element) => element.type === "rectangle");
    sourceShapes.forEach((shape, index) => {
        shape.customData = { researchItemKey: getResearchKey(items[index]) };
        converted.filter((element) => element.containerId === shape.id).forEach((label) => {
            label.customData = { researchItemKey: getResearchKey(items[index]) };
        });
    });
    return converted;
}

function createSceneElements(map, items) {
    const topic = map.keyTopic || "Key question / topic";
    const topicElements = convertToExcalidrawElements([{
        type: "rectangle",
        x: 80,
        y: 30,
        width: 400,
        height: 90,
        backgroundColor: "#312e81",
        strokeColor: "#a78bfa",
        label: { text: topic, fontSize: 20, fontFamily: 2 }
    }]);
    const topicShape = topicElements.find((element) => element.type === "rectangle");
    topicShape.customData = { graphTopic: true };
    topicElements.filter((element) => element.containerId === topicShape.id).forEach((label) => {
        label.customData = { graphTopic: true };
    });
    return [...topicElements, ...createSourceElements(map, items)];
}

function GraphEditor({ map, items, onOpenResearch }) {
    const [selectedResearchKey, setSelectedResearchKey] = useState("");
    const [saveError, setSaveError] = useState("");
    const saveTimer = useRef(0);
    const saveInProgress = useRef(false);
    const pendingScene = useRef(null);
    const apiRef = useRef(null);
    const lastSavedScene = useRef(JSON.stringify({
        elements: map.excalidrawElements || [],
        appState: map.excalidrawAppState || null,
        files: map.excalidrawFiles || {}
    }));
    const itemByKey = new Map(items.map((item) => [getResearchKey(item), item]));

    useEffect(() => () => {
        window.clearTimeout(saveTimer.current);
        if (pendingScene.current) persistPendingScene();
    }, []);

    const initialElements = Array.isArray(map.excalidrawElements) && map.excalidrawElements.length
        ? map.excalidrawElements
        : createSceneElements(map, items);
    const existingKeys = new Set(initialElements
        .filter((element) => element.customData?.researchItemKey)
        .map((element) => element.customData.researchItemKey));
    const missingItems = items.filter((item) => !existingKeys.has(getResearchKey(item)));
    const initialData = {
        elements: missingItems.length
            ? [...initialElements, ...createSourceElements(map, missingItems, existingKeys.size)]
            : initialElements,
        appState: map.excalidrawAppState || { viewBackgroundColor: "#0b1220", currentItemFontFamily: 5 },
        files: map.excalidrawFiles || {}
    };

    useEffect(() => {
        if (!apiRef.current) return;
        const currentKeys = new Set(apiRef.current.getSceneElements()
            .filter((element) => element.customData?.researchItemKey)
            .map((element) => element.customData.researchItemKey));
        const additions = items.filter((item) => !currentKeys.has(getResearchKey(item)));
        if (additions.length) {
            apiRef.current.updateScene({
                elements: [...apiRef.current.getSceneElements(), ...createSourceElements(map, additions, currentKeys.size)]
            });
        }
    }, [items, map]);

    useEffect(() => {
        const api = apiRef.current;
        if (!api || !map.keyTopic) return;
        const elements = api.getSceneElements();
        const topicShape = elements.find((element) => element.customData?.graphTopic && element.type === "rectangle");
        const topicLabel = topicShape && elements.find((element) => element.containerId === topicShape.id && element.type === "text");
        if (!topicLabel || topicLabel.text === map.keyTopic) return;
        api.updateScene({
            elements: elements.map((element) => element.id === topicLabel.id
                ? {
                    ...element,
                    text: map.keyTopic,
                    originalText: map.keyTopic,
                    version: element.version + 1,
                    versionNonce: Math.floor(Math.random() * 2 ** 31)
                }
                : element)
        });
    }, [map.keyTopic]);

    function persistPendingScene() {
        if (saveInProgress.current || !pendingScene.current) return;
        const scene = pendingScene.current;
        pendingScene.current = null;
        const signature = JSON.stringify(scene);
        if (signature === lastSavedScene.current) return;
        saveInProgress.current = true;
        chrome.storage.local.get({ researchMaps: [] }, (result) => {
            if (chrome.runtime.lastError) {
                saveErrorAndContinue(`Could not load graph data: ${chrome.runtime.lastError.message}`);
                return;
            }
            const maps = Array.isArray(result.researchMaps) ? result.researchMaps : [];
            const mapIndex = maps.findIndex((savedMap) => savedMap.id === map.id);
            if (mapIndex < 0) {
                saveErrorAndContinue("This graph no longer exists. Reopen it before continuing.");
                return;
            }
            maps[mapIndex] = {
                ...maps[mapIndex],
                excalidrawElements: scene.elements,
                excalidrawAppState: scene.appState,
                excalidrawFiles: scene.files
            };
            chrome.storage.local.set({ researchMaps: maps }, () => {
                if (chrome.runtime.lastError) {
                    saveErrorAndContinue(`Could not save graph changes: ${chrome.runtime.lastError.message}`);
                    return;
                }
                setSaveError("");
                lastSavedScene.current = signature;
                saveInProgress.current = false;
                if (pendingScene.current) persistPendingScene();
            });
        });
    }

    function saveErrorAndContinue(message) {
        setSaveError(message);
        saveInProgress.current = false;
        if (pendingScene.current) persistPendingScene();
    }

    function handleChange(elements, appState, files) {
        const selectedIds = Object.keys(appState.selectedElementIds || {}).filter((id) => appState.selectedElementIds[id]);
        const selectedElement = elements.find((element) => selectedIds.includes(element.id));
        const researchKey = selectedElement?.customData?.researchItemKey || "";
        const item = itemByKey.get(researchKey);
        setSelectedResearchKey(item ? researchKey : "");
        window.dispatchEvent(new CustomEvent("excalidraw-research-selection", {
            detail: item ? { key: researchKey, title: item.title || item.groupTitle || "Untitled research" } : null
        }));

        pendingScene.current = {
            elements,
            files,
            appState: {
                viewBackgroundColor: appState.viewBackgroundColor,
                scrollX: appState.scrollX,
                scrollY: appState.scrollY,
                zoom: appState.zoom,
                gridSize: appState.gridSize
            }
        };
        window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(persistPendingScene, 500);
    }

    return h("div", { className: "excalidraw-graph-editor" },
        h("div", { className: "excalidraw-graph-actions" },
            h("button", {
                type: "button",
                disabled: !selectedResearchKey,
                onClick: () => onOpenResearch(selectedResearchKey)
            }, "Open selected research"),
            h("span", { role: "status", "aria-live": "polite" }, saveError || "Changes save automatically")
        ),
        h("div", { className: "excalidraw-graph-canvas" },
            h(Excalidraw, {
                key: map.id,
                initialData,
                theme: "dark",
                onChange: handleChange,
                excalidrawAPI: (api) => {
                    apiRef.current = api;
                },
                UIOptions: {
                    canvasActions: {
                        changeViewBackgroundColor: false,
                        clearCanvas: true,
                        export: { saveFileToDisk: true },
                        loadScene: false,
                        saveToActiveFile: false,
                        toggleTheme: true
                    }
                }
            })
        )
    );
}

window.mountExcalidrawGraph = (container, map, items, onOpenResearch) => {
    if (activeContainer !== container) {
        activeRoot?.unmount();
        activeContainer = container;
        activeRoot = createRoot(container);
    }
    activeRoot.render(h(GraphEditor, { key: map.id, map, items, onOpenResearch }));
};

window.unmountExcalidrawGraph = () => {
    activeRoot?.unmount();
    activeRoot = undefined;
    activeContainer = undefined;
};

window.dispatchEvent(new Event("excalidraw-graph-ready"));
