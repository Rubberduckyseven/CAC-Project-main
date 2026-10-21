const researchDetail = document.getElementById("research-detail");
const researchPicker = document.getElementById("research-picker-backdrop");
const researchPickerList = document.getElementById("research-picker-list");
const researchPickerToggle = document.getElementById("saved-research-toggle");
const researchPickerClose = document.getElementById("research-picker-close");
const researchLibraryHeading = document.getElementById("research-library-heading");
const sourceSearchForm = document.getElementById("source-search-form");
const sourceSearchInput = document.getElementById("source-search-input");
const sourceSearchClear = document.getElementById("source-search-clear");
const geminiSettingsToggle = document.getElementById("gemini-settings-toggle");
const geminiSettings = document.getElementById("gemini-settings");
const geminiSettingsForm = document.getElementById("gemini-settings-form");
const geminiApiKeyInput = document.getElementById("gemini-api-key");
const geminiSettingsStatus = document.getElementById("gemini-settings-status");
const geminiKeyRemove = document.getElementById("gemini-key-remove");
const geminiSettingsClose = document.getElementById("gemini-settings-close");
const researchTypeNav = document.getElementById("research-type-nav");
const researchResultCount = document.getElementById("research-result-count");
const researchViewControls = document.getElementById("research-view-controls");
const researchCardsViewButton = document.getElementById("research-cards-view");
const researchMapViewTabs = document.getElementById("research-map-view-tabs");
const researchMapViewAdd = document.getElementById("research-map-view-add");
const researchMapCreateDialog = document.getElementById("research-map-create-dialog");
const researchMapCreateForm = document.getElementById("research-map-create-form");
const researchMapNameInput = document.getElementById("research-map-name");
const researchMapNameLabel = document.getElementById("research-map-name-label");
const researchMapTopicInput = document.getElementById("research-map-topic");
const researchMapCreateCancel = document.getElementById("research-map-create-cancel");
const researchMapCreateHeading = document.getElementById("research-map-create-heading");
const researchMapCreateSubmit = researchMapCreateForm.querySelector('[type="submit"]');
const researchInspector = document.getElementById("research-inspector");
const inspectorType = document.getElementById("inspector-type");
const inspectorContent = document.getElementById("research-inspector-content");
const inspectorClose = document.getElementById("inspector-close");
let researchItems = [];
let researchGroups = [];
let researchCategories = [];
let researchMaps = [];
let selectedResearchGroupId = "";
let activeSearchQuery = "";
let selectedResearchType = "";
let selectedResearchSubgroupId = "";
let selectedResearchItemId = "";
let activeResearchMapId = "";
let editingResearchMapId = "";
const researchMapPanOffsets = new Map();
let researchMapPanState = null;
const expandedResearchCategoryIds = new Set();
const standardResearchTypes = ["Source", "Notes", "Image", "Research"];

researchDetail.addEventListener("pointerdown", (event) => {
    if (!researchDetail.classList.contains("is-concept-map")
        || !activeResearchMapId
        || event.button !== 0
        || event.target.closest(".research-entry, button, input, textarea, select")) {
        return;
    }

    const offset = researchMapPanOffsets.get(activeResearchMapId) || { x: 0, y: 0 };
    researchMapPanState = {
        pointerId: event.pointerId,
        mapId: activeResearchMapId,
        startX: event.clientX,
        startY: event.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y
    };
    researchDetail.setPointerCapture(event.pointerId);
    researchDetail.classList.add("is-panning");
    event.preventDefault();
});

researchDetail.addEventListener("pointermove", (event) => {
    if (!researchMapPanState || event.pointerId !== researchMapPanState.pointerId) return;
    const offset = {
        x: researchMapPanState.startOffsetX + event.clientX - researchMapPanState.startX,
        y: researchMapPanState.startOffsetY + event.clientY - researchMapPanState.startY
    };
    researchMapPanOffsets.set(researchMapPanState.mapId, offset);
    const canvas = researchDetail.querySelector(".concept-map-canvas");
    if (canvas) canvas.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
});

function stopResearchMapPan(event) {
    if (!researchMapPanState || event.pointerId !== researchMapPanState.pointerId) return;
    researchMapPanState = null;
    researchDetail.classList.remove("is-panning");
    if (researchDetail.hasPointerCapture(event.pointerId)) {
        researchDetail.releasePointerCapture(event.pointerId);
    }
}

researchDetail.addEventListener("pointerup", stopResearchMapPan);
researchDetail.addEventListener("pointercancel", stopResearchMapPan);

const citationStyle = document.createElement("style");
citationStyle.textContent = `
  .research-entry-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .research-entry-title-wrap {
    flex: 1;
    min-width: 0;
  }

  .research-link-menu {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    margin-top: 6px;
    border: 1px solid rgba(255, 255, 255, 0.65);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    color: white;
    cursor: pointer;
  }

    .research-link-menu-stack > span {
    display: block;
        width: 6px;
        height: 6px;
    border-radius: 50%;
    background: currentColor;
        margin: 1px 0;
  }

  .research-link-menu .research-link-menu-stack {
    display: flex;
    width: auto;
    height: auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
  }

  .citation-menu {
    position: fixed;
    z-index: 200;
        box-sizing: border-box;
        width: min(260px, calc(100vw - 24px));
        max-height: min(75vh, 500px);
        overflow-y: auto;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .citation-menu[hidden] {
    display: none;
  }

  .citation-menu-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }

  .citation-menu-close {
    width: 22px;
    height: 22px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #2a2a2a;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
  }

  .citation-menu-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

    .citation-menu-button,
    .citation-delete-button,
    .citation-category-button,
    .citation-move-button,
  .citation-format-button,
  .citation-copy-button,
  .citation-tab-button {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font: inherit;
    cursor: pointer;
  }

  .citation-menu-button {
    width: 100%;
    min-height: 36px;
    background: white;
    color: #1b1b1b;
    font-weight: 600;
  }

    .citation-delete-button {
        width: 100%;
        min-height: 36px;
        background: #fff;
        color: #a12626;
        font-weight: 600;
    }

    .citation-category-button {
        width: 100%;
        min-height: 34px;
        overflow-wrap: anywhere;
        background: #f5f5f5;
        color: #1d1d1d;
        text-align: left;
    }

    .citation-category-button:disabled {
        color: #666;
        cursor: default;
    }

    .citation-new-category-form {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    .citation-new-category-input {
        box-sizing: border-box;
        width: 100%;
        min-height: 34px;
        padding: 6px 8px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        font: inherit;
    }

    .citation-move-button {
        min-height: 34px;
        background: #fff;
        color: #1d1d1d;
        font-weight: 600;
    }

    .citation-menu-message {
        margin: 0;
        color: #a12626;
        font-size: 12px;
    }

  .citation-format-button {
    min-height: 34px;
    background: #f5f5f5;
    color: #1d1d1d;
    font-weight: 600;
  }

  .citation-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(12, 15, 18, 0.42);
  }

  .citation-overlay[hidden] {
    display: none;
  }

  .citation-modal {
    position: relative;
    width: min(560px, calc(100vw - 30px));
    background: rgba(255, 255, 255, 0.98);
    color: #171717;
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.28);
    padding: 18px 18px 20px;
  }

  .citation-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 14px;
  }

  .citation-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .citation-tab-button {
    min-width: 72px;
    min-height: 34px;
    background: #eceaf2;
    color: #222;
    font-weight: 600;
  }

  .citation-tab-button.active {
    background: #2f2f4d;
    color: white;
  }

  .citation-modal-close {
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: 32px;
    height: 32px;
    border: 1px solid rgba(0, 0, 0, 0.16);
    border-radius: 8px;
    background: white;
    color: #111;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }

  .citation-modal-text {
    box-sizing: border-box;
    width: 100%;
    min-height: 160px;
    margin: 0 0 16px;
    padding: 12px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 10px;
    resize: vertical;
    font: 14px/1.5 Arial, sans-serif;
    background: #fafafa;
    color: #1b1b1b;
  }

  .citation-copy-button {
    min-height: 34px;
    padding: 0 14px;
    background: #2f2f4d;
    color: white;
    font-weight: 600;
  }
`;
document.head.appendChild(citationStyle);

const citationMenu = document.createElement("div");
citationMenu.className = "citation-menu";
citationMenu.hidden = true;
document.body.appendChild(citationMenu);

const citationMenuHeader = document.createElement("div");
citationMenuHeader.className = "citation-menu-header";
const citationMenuClose = document.createElement("button");
citationMenuClose.type = "button";
citationMenuClose.className = "citation-menu-close";
citationMenuClose.textContent = "×";
citationMenuClose.setAttribute("aria-label", "Close citation menu");
citationMenuHeader.appendChild(citationMenuClose);
const citationMenuBody = document.createElement("div");
citationMenuBody.className = "citation-menu-body";
citationMenu.append(citationMenuHeader, citationMenuBody);

const citationOverlay = document.createElement("div");
citationOverlay.className = "citation-overlay";
citationOverlay.hidden = true;
document.body.appendChild(citationOverlay);

const citationModal = document.createElement("div");
citationModal.className = "citation-modal";
const citationModalHeader = document.createElement("div");
citationModalHeader.className = "citation-modal-header";
const citationTabs = document.createElement("div");
citationTabs.className = "citation-tabs";
const citationText = document.createElement("textarea");
citationText.readOnly = true;
citationText.className = "citation-modal-text";
const citationCopyButton = document.createElement("button");
citationCopyButton.type = "button";
citationCopyButton.className = "citation-copy-button";
citationCopyButton.textContent = "Copy";
const citationModalClose = document.createElement("button");
citationModalClose.type = "button";
citationModalClose.className = "citation-modal-close";
citationModalClose.textContent = "×";
citationModalClose.setAttribute("aria-label", "Close citation");
citationModal.append(citationModalHeader, citationText, citationCopyButton, citationModalClose);
citationOverlay.appendChild(citationModal);

let citationMenuState = "cite";
let activeCitationItem = null;
let activeResearchGroup = null;
let activeCitationFormat = "MLA";
const citationFormats = ["MLA", "Chicago", "APA", "Harvard", "Vancouver", "IEEE", "Bluebook"];

function getCitationSourceName(item) {
    if (item?.sourceTitle) return item.sourceTitle;
    if (!item?.sourceUrl) return item?.title || "Source";

    try {
        const parsedUrl = new URL(item.sourceUrl);
        return parsedUrl.hostname.replace(/^www\./, "");
    } catch (error) {
        return item.title || "Source";
    }
}

function getCitationTitle(item) {
    return item?.title || item?.groupTitle || "Untitled source";
}

function buildCitation(item, format) {
    const sourceName = getCitationSourceName(item);
    const citationTitle = getCitationTitle(item);
    const url = item?.sourceUrl || "No source URL";
    const year = new Date().getFullYear();
    const shortDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    switch (format) {
        case "Chicago":
            return `${sourceName}. "${citationTitle}." Accessed ${shortDate}. ${url}.`;
        case "APA":
            return `${sourceName}. (${year}). ${citationTitle}. ${url}`;
        case "Harvard":
            return `${sourceName} ${year}. ${citationTitle}. Available at: ${url}.`;
        case "Vancouver":
            return `[1] ${sourceName}. ${citationTitle}. ${url}. Accessed ${shortDate}.`;
        case "IEEE":
            return `[1] ${sourceName}, "${citationTitle}," ${url}, accessed ${shortDate}.`;
        case "Bluebook":
            return `${sourceName}, ${citationTitle}, ${url} (last visited ${shortDate}).`;
        case "MLA":
        default:
            return `${sourceName}. "${citationTitle}." ${sourceName}, ${url}. Accessed ${shortDate}.`;
    }
}

function renderCitationMenu() {
    citationMenuBody.replaceChildren();

    if (citationMenuState === "groupActions") {
        const addSubtabButton = document.createElement("button");
        addSubtabButton.type = "button";
        addSubtabButton.className = "citation-menu-button";
        addSubtabButton.textContent = "Add subtab";
        addSubtabButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const type = activeResearchGroup.researchType
                || getResearchType(activeResearchGroup.items[0] || {});
            closeCitationMenu();
            addResearchSubtab(activeResearchGroup, type);
        });
        const renameButton = document.createElement("button");
        renameButton.type = "button";
        renameButton.className = "citation-menu-button";
        renameButton.textContent = "Rename";
        renameButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            renameResearchGroup(activeResearchGroup);
        });
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "citation-delete-button";
        deleteButton.textContent = "Delete category and subtabs";
        deleteButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            deleteResearchGroup(activeResearchGroup);
        });
        const deleteTabResearchButton = document.createElement("button");
        deleteTabResearchButton.type = "button";
        deleteTabResearchButton.className = "citation-delete-button";
        deleteTabResearchButton.textContent = "Delete research in this tab";
        deleteTabResearchButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            deleteResearchInGroup(activeResearchGroup);
        });
        const deleteAllResearchButton = document.createElement("button");
        deleteAllResearchButton.type = "button";
        deleteAllResearchButton.className = "citation-delete-button";
        deleteAllResearchButton.textContent = "Delete all research";
        deleteAllResearchButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            deleteAllResearch();
        });
        citationMenuBody.append(
            addSubtabButton,
            renameButton,
            deleteTabResearchButton,
            deleteAllResearchButton,
            deleteButton
        );
        return;
    }

    if (citationMenuState === "cite") {
        const refreshButton = document.createElement("button");
        refreshButton.type = "button";
        refreshButton.className = "citation-menu-button";
        refreshButton.textContent = "Refresh Gemini Summary";
        refreshButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            refreshGeminiSummary(activeCitationItem, refreshButton);
        });
        const citeButton = document.createElement("button");
        citeButton.type = "button";
        citeButton.className = "citation-menu-button";
        citeButton.textContent = "Cite";
        citeButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeCitationMenu();
            openCitationModal(activeCitationItem, activeCitationFormat);
        });
        const moveButton = document.createElement("button");
        moveButton.type = "button";
        moveButton.className = "citation-menu-button";
        moveButton.textContent = "Move to New Category";
        moveButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            citationMenuState = "categories";
            renderCitationMenu();
        });
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "citation-delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            deleteResearchItem(activeCitationItem, deleteButton);
        });
        citationMenuBody.append(refreshButton, citeButton, moveButton, deleteButton);
        return;
    }

    if (citationMenuState === "categories") {
        const currentGroupId = getResearchGroupId(activeCitationItem);
        researchGroups.forEach((group) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "citation-category-button";
            button.textContent = group.title;
            button.disabled = group.id === currentGroupId;
            if (button.disabled) button.textContent += " (Current)";
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                moveResearchItem(activeCitationItem, group.id, group.title, button);
            });
            citationMenuBody.appendChild(button);
        });

        const form = document.createElement("form");
        form.className = "citation-new-category-form";
        const input = document.createElement("input");
        input.type = "text";
        input.className = "citation-new-category-input";
        input.placeholder = "New category name";
        input.setAttribute("aria-label", "New category name");
        const message = document.createElement("p");
        message.className = "citation-menu-message";
        message.hidden = true;
        const createButton = document.createElement("button");
        createButton.type = "submit";
        createButton.className = "citation-move-button";
        createButton.textContent = "Create and move";
        form.append(input, message, createButton);
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const title = input.value.trim();
            if (!title) {
                message.textContent = "Enter a category name.";
                message.hidden = false;
                input.focus();
                return;
            }
            if (researchGroups.some((group) => normalizeTitle(group.title) === normalizeTitle(title))) {
                message.textContent = "That category already exists. Choose it above.";
                message.hidden = false;
                input.focus();
                return;
            }
            moveResearchItem(activeCitationItem, `title:${normalizeTitle(title)}`, title, createButton);
        });
        citationMenuBody.appendChild(form);
        input.focus();
        return;
    }

    citationFormats.forEach((format) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "citation-format-button";
        button.textContent = format;
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            activeCitationFormat = format;
            closeCitationMenu();
            openCitationModal(activeCitationItem, format);
        });
        citationMenuBody.appendChild(button);
    });
}

function refreshGeminiSummary(item, actionButton) {
    const excerpt = typeof item.excerpt === "string" ? item.excerpt.trim() : "";
    const notes = typeof item.notes === "string" ? item.notes.trim() : "";
    const text = [
        excerpt && `Excerpt: ${excerpt}`,
        notes && `Notes: ${notes}`
    ].filter(Boolean).join("\n\n");
    const image = item.screenshot || "";
    if (!text && !image) {
        const message = document.createElement("p");
        message.className = "citation-menu-message";
        message.textContent = "This item has no text or image to summarize.";
        citationMenuBody.appendChild(message);
        return;
    }

    actionButton.disabled = true;
    actionButton.textContent = "Refreshing summary...";
    chrome.runtime.sendMessage({ action: "summarizeResearch", text, image }, (response) => {
        const error = chrome.runtime.lastError?.message || response?.error;
        if (error || !response?.summary) {
            actionButton.disabled = false;
            actionButton.textContent = "Refresh Gemini Summary";
            const message = document.createElement("p");
            message.className = "citation-menu-message";
            message.textContent = error || "Gemini returned an empty summary.";
            citationMenuBody.appendChild(message);
            return;
        }

        chrome.storage.local.get({ researchItems: [] }, (result) => {
            if (chrome.runtime.lastError) {
                actionButton.disabled = false;
                actionButton.textContent = "Refresh Gemini Summary";
                return;
            }

            const items = Array.isArray(result.researchItems) ? result.researchItems : [];
            const itemIndex = items.findIndex((savedItem) => item.id
                ? savedItem.id === item.id
                : JSON.stringify(savedItem) === JSON.stringify(item));
            if (itemIndex === -1) {
                closeCitationMenu();
                return;
            }

            items[itemIndex] = { ...items[itemIndex], summary: response.summary };
            chrome.storage.local.set({ researchItems: items }, () => {
                if (chrome.runtime.lastError) {
                    actionButton.disabled = false;
                    actionButton.textContent = "Refresh Gemini Summary";
                    return;
                }
                closeCitationMenu();
            });
        });
    });
}

function moveResearchItem(item, groupId, groupTitle, actionButton) {
    chrome.storage.local.get({ researchItems: [] }, (result) => {
        if (chrome.runtime.lastError) {
            actionButton.textContent = "Move failed";
            return;
        }

        const items = Array.isArray(result.researchItems) ? result.researchItems : [];
        const itemIndex = items.findIndex((savedItem) => item.id
            ? savedItem.id === item.id
            : JSON.stringify(savedItem) === JSON.stringify(item));

        if (itemIndex === -1) {
            closeCitationMenu();
            return;
        }

        items[itemIndex] = { ...items[itemIndex], groupId, groupTitle };
        chrome.storage.local.set({ researchItems: items }, () => {
            if (chrome.runtime.lastError) {
                actionButton.textContent = "Move failed";
                return;
            }
            closeCitationMenu();
        });
    });
}

function deleteResearchItem(item, deleteButton) {
    const title = item?.title || item?.groupTitle || "this research";
    if (!window.confirm(`Delete "${title}" from your research map?`)) return;

    chrome.storage.local.get({ researchItems: [] }, (result) => {
        if (chrome.runtime.lastError) {
            deleteButton.textContent = "Delete failed";
            return;
        }

        const items = Array.isArray(result.researchItems) ? result.researchItems : [];
        const itemIndex = items.findIndex((savedItem) => item.id
            ? savedItem.id === item.id
            : JSON.stringify(savedItem) === JSON.stringify(item));

        if (itemIndex === -1) {
            closeCitationMenu();
            return;
        }

        items.splice(itemIndex, 1);
        chrome.storage.local.set({ researchItems: items }, () => {
            if (chrome.runtime.lastError) {
                deleteButton.textContent = "Delete failed";
                return;
            }
            closeCitationMenu();
        });
    });
}

function closeCitationMenu() {
    citationMenu.hidden = true;
    citationMenuState = "cite";
}

function handleCitationMenuClose() {
    if (citationMenuState === "groupActions") {
        closeCitationMenu();
        return;
    }

    if (citationMenuState !== "cite") {
        citationMenuState = "cite";
        renderCitationMenu();
        return;
    }

    closeCitationMenu();
}

function openResearchGroupMenu(group, triggerButton) {
    activeResearchGroup = group;
    citationMenuState = "groupActions";
    renderCitationMenu();

    const triggerRect = triggerButton.getBoundingClientRect();
    const panelWidth = 260;
    citationMenu.hidden = false;
    citationMenu.style.left = `${Math.min(triggerRect.right + 12, window.innerWidth - panelWidth - 12)}px`;
    const menuTop = Math.min(
        Math.max(12, triggerRect.top - 6),
        window.innerHeight - citationMenu.offsetHeight - 12
    );
    citationMenu.style.top = `${Math.max(12, menuTop)}px`;
}

function renameResearchGroup(group) {
    const nextTitle = window.prompt("Rename category:", group.title)?.trim();
    if (!nextTitle) return;

    if (researchGroups.some((existingGroup) => existingGroup.id !== group.id
        && existingGroup.parentId === group.parentId
        && normalizeTitle(existingGroup.title) === normalizeTitle(nextTitle))) {
        window.alert("A category with that name already exists.");
        return;
    }

    chrome.storage.local.get({ researchItems: [], researchCategories: [] }, (result) => {
        if (chrome.runtime.lastError) return;

        const items = Array.isArray(result.researchItems) ? result.researchItems : [];
        const categories = Array.isArray(result.researchCategories) ? result.researchCategories : [];
        const updatedItems = items.map((item) => getResearchGroupId(item) === group.id
            ? { ...item, groupId: group.id, groupTitle: nextTitle }
            : item);

        const categoryIndex = categories.findIndex((category) => category.id === group.id);
        if (categoryIndex === -1) {
            categories.push({
                id: group.id,
                title: nextTitle,
                parentId: group.parentId || "",
                researchType: group.researchType || getResearchType(group.items[0] || {})
            });
        } else {
            categories[categoryIndex] = { ...categories[categoryIndex], title: nextTitle };
        }

        chrome.storage.local.set({ researchItems: updatedItems, researchCategories: categories }, () => {
            if (!chrome.runtime.lastError) closeCitationMenu();
        });
    });
}

function deleteResearchGroup(group) {
    const removedCategoryIds = getCategoryDescendantIds(group.id);
    const count = researchItems.filter((item) => removedCategoryIds.has(getResearchGroupId(item))).length;
    const captureLabel = count === 1 ? "saved capture" : "saved captures";
    if (!window.confirm(`Delete category "${group.title}", its subtabs, and their ${count} ${captureLabel}?`)) return;

    chrome.storage.local.get({ researchItems: [], researchCategories: [], researchMaps: [] }, (result) => {
        if (chrome.runtime.lastError) return;

        const items = Array.isArray(result.researchItems) ? result.researchItems : [];
        const categories = Array.isArray(result.researchCategories) ? result.researchCategories : [];
        const maps = Array.isArray(result.researchMaps) ? result.researchMaps : [];
        const remainingItems = items.filter((item) => !removedCategoryIds.has(getResearchGroupId(item)));
        const remainingCategories = categories.filter((category) => !removedCategoryIds.has(category.id));
        const remainingMaps = maps.filter((map) => !removedCategoryIds.has(map.scopeKey?.replace(/^category:/, "")));
        if (selectedResearchGroupId === group.id) selectedResearchGroupId = "";
        if (removedCategoryIds.has(selectedResearchSubgroupId)) selectedResearchSubgroupId = "";
        removedCategoryIds.forEach((id) => expandedResearchCategoryIds.delete(id));
        chrome.storage.local.set({
            researchItems: remainingItems,
            researchCategories: remainingCategories,
            researchMaps: remainingMaps
        }, () => {
            if (!chrome.runtime.lastError) closeCitationMenu();
        });
    });
}

function deleteResearchInGroup(group) {
    const count = researchItems.filter((item) => getResearchGroupId(item) === group.id).length;
    const captureLabel = count === 1 ? "saved capture" : "saved captures";
    if (!window.confirm(`Delete the ${count} ${captureLabel} in "${group.title}"? Subtabs will be kept.`)) return;

    chrome.storage.local.get({ researchItems: [] }, (result) => {
        if (chrome.runtime.lastError) {
            window.alert(`Could not load research: ${chrome.runtime.lastError.message}`);
            return;
        }

        const items = Array.isArray(result.researchItems) ? result.researchItems : [];
        const remainingItems = items.filter((item) => getResearchGroupId(item) !== group.id);
        chrome.storage.local.set({ researchItems: remainingItems }, () => {
            if (chrome.runtime.lastError) {
                window.alert(`Could not delete research: ${chrome.runtime.lastError.message}`);
                return;
            }
            closeCitationMenu();
        });
    });
}

function deleteAllResearch() {
    const count = researchItems.length;
    const captureLabel = count === 1 ? "saved capture" : "saved captures";
    if (!window.confirm(`Delete all ${count} ${captureLabel}? Categories and subtabs will be kept.`)) return;

    chrome.storage.local.set({ researchItems: [] }, () => {
        if (chrome.runtime.lastError) {
            window.alert(`Could not delete research: ${chrome.runtime.lastError.message}`);
            return;
        }
        closeCitationMenu();
    });
}

function openCitationMenu(item, triggerButton) {
    activeCitationItem = item;
    citationMenuState = "cite";
    renderCitationMenu();

    const triggerRect = triggerButton.getBoundingClientRect();
    const panelWidth = 260;
    citationMenu.hidden = false;
    citationMenu.style.left = `${Math.min(triggerRect.right + 12, window.innerWidth - panelWidth - 12)}px`;
    const menuTop = Math.min(
        Math.max(12, triggerRect.top - 6),
        window.innerHeight - citationMenu.offsetHeight - 12
    );
    citationMenu.style.top = `${Math.max(12, menuTop)}px`;
}

function renderCitationModal() {
    citationTabs.replaceChildren();
    citationFormats.forEach((format) => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = `citation-tab-button ${format === activeCitationFormat ? "active" : ""}`;
        tab.textContent = format;
        tab.addEventListener("click", () => {
            activeCitationFormat = format;
            renderCitationModal();
        });
        citationTabs.appendChild(tab);
    });

    citationModalHeader.replaceChildren();
    citationModalHeader.appendChild(citationTabs);

    citationText.value = buildCitation(activeCitationItem, activeCitationFormat);
    citationCopyButton.textContent = "Copy";
    citationCopyButton.onclick = async () => {
        try {
            await navigator.clipboard.writeText(citationText.value);
            citationCopyButton.textContent = "Copied";
            setTimeout(() => {
                citationCopyButton.textContent = "Copy";
            }, 1200);
        } catch (error) {
            citationCopyButton.textContent = "Copy failed";
            setTimeout(() => {
                citationCopyButton.textContent = "Copy";
            }, 1200);
        }
    };
}

function openCitationModal(item, format) {
    activeCitationItem = item;
    activeCitationFormat = format;
    renderCitationModal();
    citationOverlay.hidden = false;
}

function closeCitationModal() {
    citationOverlay.hidden = true;
}

citationMenuClose.addEventListener("click", handleCitationMenuClose);
citationModalClose.addEventListener("click", closeCitationModal);
citationOverlay.addEventListener("click", (event) => {
    if (event.target === citationOverlay) closeCitationModal();
});
document.addEventListener("click", (event) => {
    const target = event.target;
    if (!citationMenu.hidden && !target.closest(".citation-menu") && !target.closest(".research-link-menu")) {
        closeCitationMenu();
    }
});

function normalizeTitle(title) {
    return title.trim().toLocaleLowerCase();
}

function getResearchGroupId(item) {
    return item.groupId || `title:${normalizeTitle(item.groupTitle || item.title || "Untitled research")}`;
}

function getResearchType(item) {
    if (item.categoryType === "Other") return item.customCategory || item.category || "Other";
    const category = item.category || item.categoryType || "Research";
    return category.toLocaleLowerCase() === "note" ? "Notes" : category;
}

function groupResearchItems(items, categories = []) {
    const groups = new Map();
    const categoryIds = new Set();
    categories.forEach((category) => {
        if (!category?.id || !category?.title) return;
        categoryIds.add(category.id);
        groups.set(category.id, {
            id: category.id,
            title: category.title,
            parentId: category.parentId || "",
            researchType: category.researchType || "",
            items: []
        });
    });

    items.forEach((item) => {
        const groupId = getResearchGroupId(item);
        if (!groups.has(groupId)) {
            groups.set(groupId, {
                id: groupId,
                title: item.groupTitle || item.title || "Untitled research",
                parentId: item.parentGroupId || "",
                researchType: "",
                items: []
            });
        }
        const group = groups.get(groupId);
        if (!categoryIds.has(groupId)) {
            if (item.groupTitle) group.title = item.groupTitle;
            if (item.parentGroupId) group.parentId = item.parentGroupId;
        }
        group.items.push(item);
    });

    return Array.from(groups.values(), (group) => ({
        ...group,
        items: group.items.reverse()
    }));
}

function getCategoryDescendantIds(categoryId) {
    const descendants = new Set([categoryId]);
    let addedCategory = true;
    while (addedCategory) {
        addedCategory = false;
        researchGroups.forEach((group) => {
            if (group.parentId && descendants.has(group.parentId) && !descendants.has(group.id)) {
                descendants.add(group.id);
                addedCategory = true;
            }
        });
    }
    return descendants;
}

function addResearchSubtab(parentGroup, researchType) {
    const title = window.prompt(`Add a subtab under "${parentGroup.title}":`)?.trim();
    if (!title) return;

    const siblingExists = researchGroups.some((group) => group.parentId === parentGroup.id
        && normalizeTitle(group.title) === normalizeTitle(title));
    if (siblingExists) {
        window.alert("A subtab with that name already exists here.");
        return;
    }

    chrome.storage.local.get({ researchCategories: [] }, (result) => {
        if (chrome.runtime.lastError) return;
        const categories = Array.isArray(result.researchCategories) ? result.researchCategories : [];
        const id = `category:${Date.now()}-${Math.random().toString(36).slice(2)}`;
        categories.push({ id, title, parentId: parentGroup.id, researchType });
        chrome.storage.local.set({ researchCategories: categories }, () => {
            if (chrome.runtime.lastError) return;
            expandedResearchCategoryIds.add(parentGroup.id);
            selectedResearchType = researchType;
            selectedResearchGroupId = "";
            selectedResearchSubgroupId = id;
            activeSearchQuery = "";
            sourceSearchInput.value = "";
            renderSelectedResearch();
        });
    });
}

function createResearchEntry(item) {
    const entry = document.createElement("article");
    const researchType = getResearchType(item);
    const typeClass = researchType.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    entry.className = `research-entry type-${typeClass}`;

    const header = document.createElement("div");
    header.className = "research-entry-header";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "research-entry-open";
    openButton.setAttribute("aria-label", `Open ${item.title || item.groupTitle || "saved research"}`);

    const categoryLabel = document.createElement("span");
    categoryLabel.className = "research-entry-type";
    categoryLabel.textContent = item.groupTitle || "Uncategorized";

    const title = document.createElement("h2");
    title.className = "research-entry-title";
    title.textContent = item.title || item.groupTitle || "Untitled research";
    openButton.append(categoryLabel, title);

    const sourceName = item.sourceTitle || (item.sourceUrl ? getCitationSourceName(item) : "");
    if (sourceName) {
        const source = document.createElement("p");
        source.className = "research-entry-source";
        source.textContent = sourceName;
        openButton.appendChild(source);
    }

    const previewText = item.summary || item.excerpt || item.notes;
    if (previewText) {
        const preview = document.createElement("p");
        preview.className = "research-entry-preview";
        preview.textContent = previewText;
        openButton.appendChild(preview);
    }

    if (item.screenshot) {
        const thumbnail = document.createElement("img");
        thumbnail.className = "research-entry-thumbnail";
        thumbnail.src = item.screenshot;
        thumbnail.alt = "";
        openButton.appendChild(thumbnail);
    }

    openButton.addEventListener("click", () => openResearchInspector(item));

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "research-link-menu";
    menuButton.setAttribute("aria-label", `More actions for ${item.title || item.groupTitle || "saved research"}`);

    const stack = document.createElement("span");
    stack.className = "research-link-menu-stack";
    for (let i = 0; i < 3; i += 1) {
        const dot = document.createElement("span");
        stack.appendChild(dot);
    }
    menuButton.appendChild(stack);
    menuButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCitationMenu(item, menuButton);
    });

    header.append(openButton, menuButton);
    entry.appendChild(header);
    return entry;
}

function getResearchItemKey(item) {
    return item.id || `${getResearchGroupId(item)}|${item.title || ""}|${item.createdAt || item.sourceUrl || ""}`;
}

function appendInspectorSection(label, value) {
    if (!value) return;
    const heading = document.createElement("p");
    heading.className = "inspector-section-label";
    heading.textContent = label;
    const content = document.createElement("p");
    content.textContent = value;
    inspectorContent.append(heading, content);
}

function openResearchInspector(item) {
    selectedResearchItemId = getResearchItemKey(item);
    inspectorType.textContent = getResearchType(item);
    inspectorContent.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = item.title || item.groupTitle || "Untitled research";
    inspectorContent.appendChild(title);

    const metadata = document.createElement("p");
    metadata.className = "inspector-meta";
    metadata.textContent = `Project: ${item.groupTitle || "Untitled project"}`;
    inspectorContent.appendChild(metadata);

    if (item.sourceTitle) {
        const source = document.createElement("p");
        source.className = "inspector-meta";
        source.textContent = item.sourceTitle;
        inspectorContent.appendChild(source);
    }

    if (item.sourceUrl) {
        const sourceLink = document.createElement("a");
        sourceLink.className = "inspector-link";
        sourceLink.href = item.sourceUrl;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = item.sourceUrl;
        inspectorContent.appendChild(sourceLink);
    }

    if (item.screenshot) {
        const image = document.createElement("img");
        image.className = "inspector-image";
        image.src = item.screenshot;
        image.alt = `Image attached to ${item.title || "saved research"}`;
        inspectorContent.appendChild(image);
    }

    appendInspectorSection("Gemini summary", item.summary);
    appendInspectorSection("Excerpt", item.excerpt);
    appendInspectorSection("Notes", item.notes);
    if (item.createdAt) {
        const date = new Date(item.createdAt);
        if (!Number.isNaN(date.getTime())) {
            appendInspectorSection("Saved", date.toLocaleDateString());
        }
    }

    researchInspector.hidden = false;
    document.body.classList.add("inspector-open");
}

function closeResearchInspector() {
    researchInspector.hidden = true;
    selectedResearchItemId = "";
    document.body.classList.remove("inspector-open");
}

function renderResearchSidebar() {
    researchTypeNav.replaceChildren();
    const counts = new Map();
    researchItems.forEach((item) => {
        const type = getResearchType(item);
        counts.set(type, (counts.get(type) || 0) + 1);
    });

    const categoryTypes = researchGroups.map((group) => group.researchType).filter(Boolean);
    const availableTypes = Array.from(new Set([...counts.keys(), ...categoryTypes]));
    const orderedTypes = [
        ...standardResearchTypes.filter((type) => availableTypes.includes(type)),
        ...availableTypes
            .filter((type) => !standardResearchTypes.includes(type))
            .sort((left, right) => left.localeCompare(right))
    ];

    const addFilter = (label, type, count) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "research-type-button";
        button.setAttribute("aria-current", String(!activeSearchQuery
            && selectedResearchGroupId === ""
            && selectedResearchType === type
            && selectedResearchSubgroupId === ""));
        const name = document.createElement("span");
        name.textContent = label;
        const total = document.createElement("span");
        total.className = "research-type-count";
        total.textContent = count;
        button.append(name, total);
        button.addEventListener("click", () => {
            selectedResearchGroupId = "";
            selectedResearchType = type;
            selectedResearchSubgroupId = "";
            activeSearchQuery = "";
            sourceSearchInput.value = "";
            renderSelectedResearch();
        });
        return button;
    };

    addFilter("All Projects", "", researchItems.length);
    orderedTypes.forEach((type) => {
        const typeGroup = document.createElement("div");
        typeGroup.className = "research-type-group";
        typeGroup.appendChild(addFilter(type, type, counts.get(type) || 0));

        const categoryIds = new Set();
        researchGroups.forEach((group) => {
            if (group.researchType === type || group.items.some((item) => getResearchType(item) === type)) {
                let currentGroup = group;
                while (currentGroup && !categoryIds.has(currentGroup.id)) {
                    categoryIds.add(currentGroup.id);
                    currentGroup = researchGroups.find((candidate) => candidate.id === currentGroup.parentId);
                }
            }
        });

        const typeGroups = researchGroups.filter((group) => categoryIds.has(group.id));
        const childrenByParent = new Map();
        typeGroups.forEach((group) => {
            const parentId = categoryIds.has(group.parentId) ? group.parentId : "";
            if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
            childrenByParent.get(parentId).push(group);
        });
        childrenByParent.forEach((children) => children.sort((left, right) => left.title.localeCompare(right.title)));

        const countForCategory = (groupId) => {
            const descendantIds = getCategoryDescendantIds(groupId);
            return researchItems.filter((item) => getResearchType(item) === type
                && descendantIds.has(getResearchGroupId(item))).length;
        };

        const renderCategory = (group, depth) => {
            const childGroups = childrenByParent.get(group.id) || [];
            const isExpanded = expandedResearchCategoryIds.has(group.id);
            const categoryRow = document.createElement("div");
            categoryRow.className = "research-category-group";

            const button = document.createElement("button");
            button.type = "button";
            button.className = "research-subtype-button";
            button.style.paddingLeft = `${8 + depth * 12}px`;
            button.setAttribute("aria-current", String(!activeSearchQuery
                && selectedResearchGroupId === ""
                && selectedResearchType === type
                && selectedResearchSubgroupId === group.id));
            if (childGroups.length) button.setAttribute("aria-expanded", String(isExpanded));
            const name = document.createElement("span");
            name.textContent = group.title;
            const total = document.createElement("span");
            total.className = "research-type-count";
            total.textContent = countForCategory(group.id);
            if (childGroups.length) {
                button.classList.add("has-subtabs");
                const caret = document.createElement("span");
                caret.className = "research-subtab-caret";
                caret.textContent = "›";
                button.append(caret, name, total);
            } else {
                button.append(name, total);
            }
            button.addEventListener("click", () => {
                selectedResearchGroupId = "";
                selectedResearchType = type;
                selectedResearchSubgroupId = group.id;
                activeSearchQuery = "";
                sourceSearchInput.value = "";
                if (childGroups.length) {
                    if (isExpanded) expandedResearchCategoryIds.delete(group.id);
                    else expandedResearchCategoryIds.add(group.id);
                }
                renderSelectedResearch();
            });

            const addButton = document.createElement("button");
            addButton.type = "button";
            addButton.className = "research-subtab-add";
            addButton.textContent = "+";
            addButton.title = `Add a subtab under ${group.title}`;
            addButton.setAttribute("aria-label", `Add a subtab under ${group.title}`);
            addButton.addEventListener("click", (event) => {
                event.stopPropagation();
                addResearchSubtab(group, type);
            });

            const manageButton = document.createElement("button");
            manageButton.type = "button";
            manageButton.className = "research-subtab-add";
            manageButton.textContent = "⋯";
            manageButton.title = `Manage ${group.title}`;
            manageButton.setAttribute("aria-label", `Manage ${group.title}`);
            manageButton.addEventListener("click", (event) => {
                event.stopPropagation();
                openResearchGroupMenu(group, manageButton);
            });

            const row = document.createElement("div");
            row.className = "research-subtab-row";
            row.append(button, manageButton, addButton);
            categoryRow.appendChild(row);

            if (childGroups.length && isExpanded) {
                const childList = document.createElement("div");
                childList.className = "research-subtype-list";
                childGroups.forEach((child) => childList.appendChild(renderCategory(child, depth + 1)));
                categoryRow.appendChild(childList);
            }
            return categoryRow;
        };

        (childrenByParent.get("") || []).forEach((group) => {
            typeGroup.appendChild(renderCategory(group, 0));
        });

        researchTypeNav.appendChild(typeGroup);
    });
}

function getResearchViewScopeKey() {
    if (selectedResearchSubgroupId) return `category:${selectedResearchSubgroupId}`;
    if (selectedResearchGroupId) return `category:${selectedResearchGroupId}`;
    if (selectedResearchType) return `type:${selectedResearchType}`;
    return "all";
}

function renderResearchViewControls() {
    researchMapViewTabs.replaceChildren();
    if (activeSearchQuery) {
        researchViewControls.hidden = true;
        return;
    }

    const scopeKey = getResearchViewScopeKey();
    const scopedMaps = researchMaps.filter((map) => map.scopeKey === scopeKey);
    if (activeResearchMapId && !scopedMaps.some((map) => map.id === activeResearchMapId)) {
        activeResearchMapId = "";
    }
    researchViewControls.hidden = false;
    researchCardsViewButton.setAttribute("aria-current", String(!activeResearchMapId));

    scopedMaps.forEach((map) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "research-view-button";
        button.textContent = map.name;
        button.setAttribute("aria-current", String(map.id === activeResearchMapId));
        button.addEventListener("click", () => {
            activeResearchMapId = map.id;
            renderSelectedResearch();
        });
        researchMapViewTabs.appendChild(button);
    });
}

function renderConceptMap(map, items) {
    researchDetail.replaceChildren();
    researchDetail.classList.add("is-concept-map");

    const canvasWidth = Math.max(1, researchDetail.clientWidth);
    const canvasHeight = Math.max(1, researchDetail.clientHeight);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const canvas = document.createElement("div");
    canvas.className = "concept-map-canvas";
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    const panOffset = researchMapPanOffsets.get(map.id) || { x: 0, y: 0 };
    canvas.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px)`;

    const links = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    links.classList.add("concept-map-links");
    links.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`);
    links.setAttribute("aria-hidden", "true");

    const topicNode = document.createElement("section");
    topicNode.className = "concept-map-topic";
    topicNode.style.left = `${centerX}px`;
    topicNode.style.top = `${centerY}px`;
    const topicLabel = document.createElement("span");
    topicLabel.className = "concept-map-topic-label";
    topicLabel.textContent = "Key question / topic";
    const topicText = document.createElement("h2");
    topicText.textContent = map.keyTopic;
    const editTopicButton = document.createElement("button");
    editTopicButton.type = "button";
    editTopicButton.className = "concept-map-topic-edit";
    editTopicButton.textContent = "Edit question";
    editTopicButton.addEventListener("click", () => {
        editingResearchMapId = map.id;
        researchMapCreateForm.reset();
        researchMapCreateHeading.textContent = "Edit key question or topic";
        researchMapCreateSubmit.textContent = "Save changes";
        researchMapNameLabel.hidden = true;
        researchMapNameInput.hidden = true;
        researchMapTopicInput.value = map.keyTopic || "";
        researchMapCreateDialog.showModal();
        researchMapTopicInput.focus();
    });
    topicNode.append(topicLabel, topicText, editTopicButton);
    canvas.append(links, topicNode);

    items.forEach((item, index) => {
        const ring = Math.floor(index / 8) + 1;
        const ringStartIndex = (ring - 1) * 8;
        const itemsInRing = Math.min(8, items.length - ringStartIndex);
        const positionInRing = index - ringStartIndex;
        const angle = -Math.PI / 2 + (positionInRing / itemsInRing) * Math.PI * 2;
        const radiusX = ring === 1
            ? Math.min(290, canvasWidth * 0.33)
            : Math.min(360 * ring, canvasWidth * 0.42 + (ring - 1) * 120);
        const radiusY = ring === 1
            ? Math.min(185, canvasHeight * 0.32)
            : Math.min(250 * ring, canvasHeight * 0.38 + (ring - 1) * 100);
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.classList.add("concept-map-link");
        line.setAttribute("x1", centerX);
        line.setAttribute("y1", centerY);
        line.setAttribute("x2", x);
        line.setAttribute("y2", y);
        links.appendChild(line);

        const sourceNode = createResearchEntry(item);
        sourceNode.classList.add("concept-map-source");
        sourceNode.style.left = `${x}px`;
        sourceNode.style.top = `${y}px`;
        canvas.appendChild(sourceNode);
    });

    researchDetail.appendChild(canvas);
}

function renderSelectedResearch() {
    researchDetail.replaceChildren();
    researchDetail.classList.remove("is-concept-map");
    renderResearchSidebar();
    renderResearchViewControls();

    const searchTerms = normalizeTitle(activeSearchQuery).split(/\s+/).filter(Boolean);
    const matches = researchItems.filter((item) => {
        if (activeSearchQuery) {
            const searchableText = [
                item.groupTitle,
                item.title,
                item.sourceTitle,
                item.sourceUrl,
                item.category,
                item.categoryType,
                item.customCategory,
                item.excerpt,
                item.notes,
                item.summary
            ].filter(Boolean).join(" ").toLocaleLowerCase();
            return searchTerms.every((term) => searchableText.includes(term));
        }
        if (selectedResearchGroupId && getResearchGroupId(item) !== selectedResearchGroupId) return false;
        if (selectedResearchType && getResearchType(item) !== selectedResearchType) return false;
        return !selectedResearchSubgroupId
            || getCategoryDescendantIds(selectedResearchSubgroupId).has(getResearchGroupId(item));
    });

    const group = researchGroups.find((researchGroup) => researchGroup.id === selectedResearchGroupId);
    const subgroup = researchGroups.find((researchGroup) => researchGroup.id === selectedResearchSubgroupId);
    const activeMap = researchMaps.find((map) => map.id === activeResearchMapId);
    researchLibraryHeading.textContent = activeSearchQuery
        ? "Search Results"
        : activeMap?.name || group?.title || subgroup?.title || selectedResearchType || "All Projects";
    researchResultCount.textContent = `${matches.length} ${matches.length === 1 ? "item" : "items"}`;

    if (activeMap && !activeSearchQuery) {
        renderConceptMap(activeMap, matches);
        return;
    }

    if (selectedResearchItemId && !matches.some((item) => getResearchItemKey(item) === selectedResearchItemId)) {
        closeResearchInspector();
    }

    if (!matches.length) {
        const message = document.createElement("p");
        message.className = "research-empty";
        message.textContent = activeSearchQuery
            ? `No sources match "${activeSearchQuery}".`
            : selectedResearchItemsEmptyMessage();
        researchDetail.appendChild(message);
        return;
    }

    matches.forEach((item) => researchDetail.appendChild(createResearchEntry(item)));
}

function selectedResearchItemsEmptyMessage() {
    return researchItems.length ? "No saved research in this view." : "no categories or saved research.";
}

function renderResearchPicker() {
    researchPickerList.replaceChildren();

    if (!researchGroups.length) {
        const message = document.createElement("p");
        message.className = "research-empty";
        message.textContent = "Nothing saved yet.";
        researchPickerList.appendChild(message);
        return;
    }

    const groupsByParent = new Map();
    researchGroups.forEach((group) => {
        const parentId = researchGroups.some((candidate) => candidate.id === group.parentId)
            ? group.parentId
            : "";
        if (!groupsByParent.has(parentId)) groupsByParent.set(parentId, []);
        groupsByParent.get(parentId).push(group);
    });
    groupsByParent.forEach((groups) => groups.sort((left, right) => left.title.localeCompare(right.title)));

    const renderGroup = (group, depth) => {
        const node = document.createElement("div");
        node.className = "research-picker-category";
        const row = document.createElement("div");
        row.className = "research-picker-row";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "research-picker-item";
        button.setAttribute("aria-current", String(
            group.id === selectedResearchGroupId || group.id === selectedResearchSubgroupId
        ));

        const title = document.createElement("span");
        title.className = "research-picker-item-title";
        title.textContent = group.title;
        button.appendChild(title);

        const descendantIds = getCategoryDescendantIds(group.id);
        const captures = researchItems.filter((item) => descendantIds.has(getResearchGroupId(item)));
        const captureCount = captures.length;
        if (captureCount > 1) {
            const count = document.createElement("span");
            count.className = "research-picker-item-source";
            count.textContent = `${captureCount} saved captures`;
            button.appendChild(count);
        } else if (captures[0]?.sourceUrl) {
            const source = document.createElement("span");
            source.className = "research-picker-item-source";
            source.textContent = captures[0].sourceUrl;
            button.appendChild(source);
        }

        button.addEventListener("click", () => {
            selectedResearchGroupId = "";
            selectedResearchType = "";
            selectedResearchSubgroupId = group.id;
            activeSearchQuery = "";
            sourceSearchInput.value = "";
            renderSelectedResearch();
            renderResearchPicker();
            closeResearchPicker();
        });

        const menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.className = "research-link-menu research-picker-menu";
        menuButton.setAttribute("aria-label", `Manage ${group.title} category`);
        const stack = document.createElement("span");
        stack.className = "research-link-menu-stack";
        for (let index = 0; index < 3; index += 1) {
            stack.appendChild(document.createElement("span"));
        }
        menuButton.appendChild(stack);
        menuButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openResearchGroupMenu(group, menuButton);
        });

        row.append(button, menuButton);
        node.appendChild(row);

        const children = groupsByParent.get(group.id) || [];
        if (children.length) {
            const childList = document.createElement("div");
            childList.className = "research-picker-children";
            children.forEach((child) => childList.appendChild(renderGroup(child, depth + 1)));
            node.appendChild(childList);
        }
        return node;
    };

    (groupsByParent.get("") || []).forEach((group) => {
        researchPickerList.appendChild(renderGroup(group, 0));
    });
}

function openResearchPicker() {
    researchPicker.hidden = false;
    researchPickerToggle.setAttribute("aria-expanded", "true");
    researchPickerList.querySelector("button")?.focus();
}

function closeResearchPicker() {
    researchPicker.hidden = true;
    researchPickerToggle.setAttribute("aria-expanded", "false");
    researchPickerToggle.focus();
}

researchPickerToggle.addEventListener("click", openResearchPicker);
researchPickerClose.addEventListener("click", closeResearchPicker);
sourceSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    activeSearchQuery = sourceSearchInput.value.trim();
    renderSelectedResearch();
});
sourceSearchClear.addEventListener("click", () => {
    sourceSearchInput.value = "";
    activeSearchQuery = "";
    renderSelectedResearch();
    sourceSearchInput.focus();
});
researchCardsViewButton.addEventListener("click", () => {
    activeResearchMapId = "";
    renderSelectedResearch();
});
researchMapViewAdd.addEventListener("click", () => {
    editingResearchMapId = "";
    researchMapCreateForm.reset();
    researchMapCreateHeading.textContent = "Create concept map";
    researchMapCreateSubmit.textContent = "Create map";
    researchMapNameLabel.hidden = false;
    researchMapNameInput.hidden = false;
    researchMapCreateDialog.showModal();
    researchMapTopicInput.focus();
});
researchMapCreateCancel.addEventListener("click", () => researchMapCreateDialog.close());
researchMapCreateDialog.addEventListener("close", () => {
    editingResearchMapId = "";
    researchMapNameLabel.hidden = false;
    researchMapNameInput.hidden = false;
    researchMapCreateHeading.textContent = "Create concept map";
    researchMapCreateSubmit.textContent = "Create map";
});
researchMapCreateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const keyTopic = researchMapTopicInput.value.trim();
    if (!keyTopic) {
        researchMapTopicInput.setCustomValidity("Enter a key question or topic to anchor the map.");
        researchMapTopicInput.reportValidity();
        return;
    }
    researchMapTopicInput.setCustomValidity("");

    chrome.storage.local.get({ researchMaps: [] }, (result) => {
        if (chrome.runtime.lastError) {
            window.alert(`Could not load concept maps: ${chrome.runtime.lastError.message}`);
            return;
        }
        const maps = Array.isArray(result.researchMaps) ? result.researchMaps : [];
        if (editingResearchMapId) {
            const mapIndex = maps.findIndex((map) => map.id === editingResearchMapId);
            if (mapIndex === -1) {
                window.alert("This concept map no longer exists. Reopen it and try again.");
                researchMapCreateDialog.close();
                return;
            }

            maps[mapIndex] = { ...maps[mapIndex], keyTopic };
            chrome.storage.local.set({ researchMaps: maps }, () => {
                if (chrome.runtime.lastError) {
                    window.alert(`Could not update the key question: ${chrome.runtime.lastError.message}`);
                    return;
                }
                researchMaps = maps;
                researchMapCreateDialog.close();
                renderSelectedResearch();
            });
            return;
        }

        const scopeKey = getResearchViewScopeKey();
        const scopedMaps = maps.filter((map) => map.scopeKey === scopeKey);
        const suggestedName = `Map ${scopedMaps.length + 1}`;
        const id = `research-map:${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const map = {
            id,
            scopeKey,
            name: researchMapNameInput.value.trim() || suggestedName,
            keyTopic,
            createdAt: new Date().toISOString()
        };
        maps.push(map);
        chrome.storage.local.set({ researchMaps: maps }, () => {
            if (chrome.runtime.lastError) return;
            researchMaps = maps;
            activeResearchMapId = id;
            researchMapCreateDialog.close();
            renderSelectedResearch();
        });
    });
});
researchPicker.addEventListener("click", (event) => {
    if (event.target === researchPicker) closeResearchPicker();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !researchPicker.hidden) closeResearchPicker();
    if (event.key === "Escape" && !researchInspector.hidden) closeResearchInspector();
});
inspectorClose.addEventListener("click", closeResearchInspector);

geminiSettingsToggle.addEventListener("click", () => {
    geminiApiKeyInput.value = "";
    geminiSettingsStatus.textContent = "Checking saved key...";
    geminiSettings.showModal();
    geminiApiKeyInput.focus();
    chrome.storage.local.get("geminiApiKey", (result) => {
        geminiSettingsStatus.textContent = chrome.runtime.lastError
            ? "Could not check the saved key."
            : result.geminiApiKey
                ? "A Gemini API key is saved in this browser."
                : "No Gemini API key is saved.";
    });
});

geminiSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const apiKey = geminiApiKeyInput.value.trim();
    if (!apiKey) {
        geminiSettingsStatus.textContent = "Enter an API key to save it.";
        geminiApiKeyInput.focus();
        return;
    }

    chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        geminiApiKeyInput.value = "";
        geminiSettingsStatus.textContent = chrome.runtime.lastError
            ? "Could not save the API key."
            : "Gemini API key saved in this browser.";
    });
});

geminiKeyRemove.addEventListener("click", () => {
    chrome.storage.local.remove("geminiApiKey", () => {
        geminiApiKeyInput.value = "";
        geminiSettingsStatus.textContent = chrome.runtime.lastError
            ? "Could not remove the API key."
            : "Gemini API key removed.";
    });
});

geminiSettingsClose.addEventListener("click", () => geminiSettings.close());
geminiSettings.addEventListener("close", () => {
    geminiApiKeyInput.value = "";
});

function loadResearchItems() {
    chrome.storage.local.get({ researchItems: [], researchCategories: [], researchMaps: [] }, (result) => {
    if (chrome.runtime.lastError) {
        researchItems = [];
        researchCategories = [];
        researchMaps = [];
        researchGroups = [];
        researchPickerList.replaceChildren();
        const message = document.createElement("p");
        message.className = "research-empty";
        message.textContent = "Saved research could not be loaded.";
        researchPickerList.appendChild(message);
        renderSelectedResearch();
        return;
    }

        researchItems = Array.isArray(result.researchItems) ? result.researchItems : [];
    researchCategories = Array.isArray(result.researchCategories) ? result.researchCategories : [];
        researchMaps = Array.isArray(result.researchMaps) ? result.researchMaps : [];
    researchGroups = groupResearchItems(researchItems, researchCategories);
        selectedResearchGroupId = "";
        renderResearchPicker();
        renderSelectedResearch();
    });
}

loadResearchItems();

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && (changes.researchItems || changes.researchCategories || changes.researchMaps)) {
        const previousGroupId = selectedResearchGroupId;
        if (changes.researchItems) {
            researchItems = Array.isArray(changes.researchItems.newValue)
                ? changes.researchItems.newValue
                : [];
        }
        if (changes.researchCategories) {
            researchCategories = Array.isArray(changes.researchCategories.newValue)
                ? changes.researchCategories.newValue
                : [];
        }
        if (changes.researchMaps) {
            researchMaps = Array.isArray(changes.researchMaps.newValue)
                ? changes.researchMaps.newValue
                : [];
        }
        if (activeResearchMapId && !researchMaps.some((map) => map.id === activeResearchMapId)) {
            activeResearchMapId = "";
        }
        researchGroups = groupResearchItems(researchItems, researchCategories);
        selectedResearchGroupId = researchGroups.some((group) => group.id === previousGroupId)
            ? previousGroupId
            : "";
        if (selectedResearchSubgroupId
            && !researchGroups.some((group) => group.id === selectedResearchSubgroupId)) {
            selectedResearchSubgroupId = "";
        }
        renderResearchPicker();
        renderSelectedResearch();

        if (selectedResearchItemId) {
            const selectedItem = researchItems.find((item) => getResearchItemKey(item) === selectedResearchItemId);
            if (selectedItem) {
                openResearchInspector(selectedItem);
            } else {
                closeResearchInspector();
            }
        }
    }
});