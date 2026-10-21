if (!document.getElementById("searchlight-bubble")) {
    const bubble = document.createElement("button");
    bubble.id = "searchlight-bubble";
    bubble.className = "searchlight-bubble";
    bubble.type = "button";
    bubble.title = "Searchlight: click to save research, double-click to open your research map";
    bubble.setAttribute("aria-label", "Open Searchlight research capture");

    const popup = document.createElement("section");
    popup.className = "searchlight-popup";
    popup.setAttribute("aria-label", "Save research material");
    popup.innerHTML = `
        <div class="searchlight-popup-header">
            <h2>Save research</h2>
            <button class="searchlight-clear-form" type="button" title="Clear all fields" aria-label="Clear all fields">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 6h18M8 6V4h8v2m3 0-.9 14H5.9L5 6m4 4v7m6-7v7"></path>
                </svg>
            </button>
        </div>
        <select class="searchlight-title-choice" aria-label="Save under a title">
            <option value="__new__">Create a new title...</option>
        </select>
        <div class="searchlight-new-title-wrap">
            <input class="searchlight-new-title" type="text" placeholder="New category title" aria-label="New category title">
        </div>
        <input class="searchlight-research-title" type="text" placeholder="Name this research" aria-label="Research title">
        <select class="searchlight-category" aria-label="Category">
            <option>Source</option>
            <option>Notes</option>
            <option>Image</option>
            <option>Research</option>
            <option value="Other">Other...</option>
        </select>
        <div class="searchlight-other-category-wrap" hidden>
            <input class="searchlight-other-category" type="text" placeholder="Type of research" aria-label="Other type of research">
        </div>
        <textarea class="searchlight-excerpt" placeholder="Excerpt" aria-label="Excerpt"></textarea>
        <textarea class="searchlight-notes" placeholder="Notes" aria-label="Notes"></textarea>
        <div class="searchlight-capture-actions">
            <label class="searchlight-upload" for="searchlight-image-upload">Upload image</label>
            <input id="searchlight-image-upload" class="searchlight-file" type="file" accept="image/*">
            <button class="searchlight-screenshot" type="button">Capture page</button>
        </div>
        <div class="searchlight-image-preview" hidden>
            <img alt="Screenshot preview">
            <button class="searchlight-remove-image" type="button" aria-label="Remove screenshot">Remove</button>
        </div>
        <div class="searchlight-source"></div>
        <div class="searchlight-status" role="status" aria-live="polite"></div>
        <button class="searchlight-save" type="button">Save research</button>
    `;

    document.body.append(popup, bubble);

    const titleChoice = popup.querySelector(".searchlight-title-choice");
    const newTitleInput = popup.querySelector(".searchlight-new-title");
    const newTitleWrap = popup.querySelector(".searchlight-new-title-wrap");
    const researchTitleInput = popup.querySelector(".searchlight-research-title");
    const categoryInput = popup.querySelector(".searchlight-category");
    const otherCategoryWrap = popup.querySelector(".searchlight-other-category-wrap");
    const otherCategoryInput = popup.querySelector(".searchlight-other-category");
    const excerptInput = popup.querySelector(".searchlight-excerpt");
    const notesInput = popup.querySelector(".searchlight-notes");
    const fileInput = popup.querySelector(".searchlight-file");
    const screenshotButton = popup.querySelector(".searchlight-screenshot");
    const saveButton = popup.querySelector(".searchlight-save");
    const imagePreview = popup.querySelector(".searchlight-image-preview");
    const previewImage = imagePreview.querySelector("img");
    const status = popup.querySelector(".searchlight-status");
    const source = popup.querySelector(".searchlight-source");
    const clearFormButton = popup.querySelector(".searchlight-clear-form");
    let screenshotData = "";
    let selectedText = "";
    let statusTimer = null;
    let dragState = null;
    let bubbleWasDragged = false;
    let isCapturingScreenshot = false;
    const createNewTitleValue = "__new__";

    function isOnResearchMapPage() {
        const mapUrl = chrome.runtime.getURL("research-map.html");
        return location.href === mapUrl
            || location.href.startsWith(`${mapUrl}?`)
            || location.href.startsWith(`${mapUrl}#`)
            || location.pathname.endsWith("/research-map.html");
    }

    source.textContent = location.pathname.endsWith("/research-map.html")
        ? "Research Map"
        : location.hostname;

    function setStatus(message, isError = false, duration = 5000) {
        clearTimeout(statusTimer);
        status.textContent = message;
        status.classList.toggle("is-error", isError);

        if (message && duration > 0) {
            statusTimer = setTimeout(() => {
                status.textContent = "";
                status.classList.remove("is-error");
                statusTimer = null;
            }, duration);
        }
    }

    function setSavingState(isSaving) {
        popup.querySelectorAll("input, textarea, select, button").forEach((control) => {
            control.disabled = isSaving;
        });
    }

    function normalizeTitle(title) {
        return title.trim().toLocaleLowerCase();
    }

    function capitalizeFirstLetter(event) {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || input === fileInput) {
            return;
        }

        const value = input.value;
        if (!value) {
            input.value = "";
            return;
        }

        input.value = value.charAt(0).toUpperCase() + value.slice(1);
    }

    function getResearchGroupId(item) {
        return item.groupId || `title:${normalizeTitle(item.groupTitle || item.title || "Untitled research")}`;
    }

    function updateNewTitleVisibility() {
        const creatingNewTitle = titleChoice.value === createNewTitleValue;
        newTitleWrap.hidden = !creatingNewTitle;
        newTitleInput.required = creatingNewTitle;
    }

    function updateOtherCategoryVisibility() {
        const isOtherCategory = categoryInput.value === "Other";
        otherCategoryWrap.hidden = !isOtherCategory;
        otherCategoryInput.required = isOtherCategory;
    }

    function refreshTitleChoices(preferredValue = titleChoice.value) {
        chrome.storage.local.get({ researchItems: [], researchCategories: [] }, (result) => {
            if (chrome.runtime.lastError) return;

            const items = Array.isArray(result.researchItems) ? result.researchItems : [];
            const groups = new Map();
            const categories = Array.isArray(result.researchCategories) ? result.researchCategories : [];
            const categoriesById = new Map(categories.map((category) => [category.id, category]));
            categories.forEach((category) => {
                if (category?.id && category?.title) groups.set(category.id, category.title);
            });
            items.forEach((item) => {
                const groupId = getResearchGroupId(item);
                if (!groups.has(groupId)) {
                    groups.set(groupId, item.groupTitle || item.title || "Untitled research");
                }
            });

            const getCategoryLabel = (groupId, fallbackTitle) => {
                const path = [];
                const visited = new Set();
                let category = categoriesById.get(groupId);
                while (category && !visited.has(category.id)) {
                    visited.add(category.id);
                    path.unshift(category.title);
                    category = categoriesById.get(category.parentId);
                }
                return path.join(" / ") || fallbackTitle;
            };

            titleChoice.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
            groups.forEach((title, groupId) => {
                const option = document.createElement("option");
                option.value = groupId;
                option.textContent = getCategoryLabel(groupId, title);
                titleChoice.appendChild(option);
            });

            const hasPreferredChoice = Array.from(titleChoice.options).some((option) => option.value === preferredValue);
            titleChoice.value = hasPreferredChoice ? preferredValue : createNewTitleValue;
            updateNewTitleVisibility();
        });
    }

    function clampBubblePosition(nextLeft, nextTop) {
        const margin = 12;
        const maxLeft = Math.max(margin, window.innerWidth - bubble.offsetWidth - margin);
        const maxTop = Math.max(margin, window.innerHeight - bubble.offsetHeight - margin);
        return {
            left: Math.min(Math.max(margin, nextLeft), maxLeft),
            top: Math.min(Math.max(margin, nextTop), maxTop)
        };
    }

    function resetBubblePosition() {
        const currentRect = bubble.getBoundingClientRect();
        const nearestLeft = currentRect.left < window.innerWidth - currentRect.right ? 20 : window.innerWidth - bubble.offsetWidth - 20;
        const nearestTop = currentRect.top < window.innerHeight - currentRect.bottom ? 20 : window.innerHeight - bubble.offsetHeight - 20;

        bubble.style.transition = "none";
        bubble.style.left = `${currentRect.left}px`;
        bubble.style.top = `${currentRect.top}px`;
        bubble.style.right = "auto";
        bubble.style.bottom = "auto";
        bubble.style.opacity = "0";
        bubble.style.filter = "blur(2px)";
        bubble.style.transform = "scale(1.7)";
        bubble.classList.remove("is-hidden");

        requestAnimationFrame(() => {
            bubble.style.transition = "left 180ms ease, top 180ms ease, right 180ms ease, bottom 180ms ease, transform 180ms ease, opacity 180ms ease, filter 180ms ease";
            bubble.style.left = `${nearestLeft}px`;
            bubble.style.top = `${nearestTop}px`;
            bubble.style.right = "auto";
            bubble.style.bottom = "auto";
            bubble.style.opacity = "0";
            bubble.style.filter = "blur(2px)";
            bubble.style.transform = "scale(0.25)";

            requestAnimationFrame(() => {
                bubble.style.transition = "left 260ms cubic-bezier(0.2, 0.8, 0.2, 1), top 260ms cubic-bezier(0.2, 0.8, 0.2, 1), right 260ms cubic-bezier(0.2, 0.8, 0.2, 1), bottom 260ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 220ms ease, opacity 200ms ease, filter 220ms ease";
                bubble.style.left = "";
                bubble.style.top = "";
                bubble.style.right = "20px";
                bubble.style.bottom = "20px";
                bubble.style.opacity = "0";
                bubble.style.filter = "blur(1px)";
                bubble.style.transform = "translateY(120px) scale(0.5)";

                requestAnimationFrame(() => {
                    bubble.style.opacity = "1";
                    bubble.style.filter = "blur(0)";
                    bubble.style.transform = "translateY(0) scale(1)";
                });
            });
        });

        if (popup.classList.contains("is-open")) {
            popup.style.left = "";
            popup.style.top = "";
            popup.style.right = "20px";
            popup.style.bottom = "85px";
        }
    }

    function updatePopupPosition() {
        if (!popup.classList.contains("is-open") || isCapturingScreenshot) return;

        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const maxPopupHeight = Math.max(0, Math.min(620, viewportHeight * 0.8, viewportHeight - 24));
        popup.style.maxHeight = `${maxPopupHeight}px`;

        const bubbleRect = bubble.getBoundingClientRect();
        const popupWidth = popup.offsetWidth || 320;
        const popupHeight = popup.offsetHeight || 320;
        let nextLeft = bubbleRect.left + bubbleRect.width + 12;
        let nextTop = bubbleRect.top + bubbleRect.height - popupHeight + 4;

        if (nextLeft + popupWidth > window.innerWidth - 12) {
            nextLeft = bubbleRect.left - popupWidth - 12;
        }

        nextTop = Math.min(nextTop, viewportHeight - popupHeight - 12);
        nextTop = Math.max(nextTop, 12);

        if (nextLeft < 12) {
            nextLeft = 12;
        }

        popup.style.left = `${nextLeft}px`;
        popup.style.top = `${nextTop}px`;
        popup.style.right = "auto";
        popup.style.bottom = "auto";
    }

    function clearForm() {
        popup.querySelectorAll('input[type="text"], textarea').forEach((input) => {
            input.value = "";
        });
        titleChoice.value = createNewTitleValue;
        categoryInput.value = "Source";
        fileInput.value = "";
        screenshotData = "";
        previewImage.removeAttribute("src");
        imagePreview.hidden = true;
        clearTimeout(statusTimer);
        status.textContent = "";
        status.classList.remove("is-error");
        updateNewTitleVisibility();
        updateOtherCategoryVisibility();
        researchTitleInput.focus();
    }

    const popupResizeObserver = new ResizeObserver(updatePopupPosition);
    popupResizeObserver.observe(popup);
    window.addEventListener("resize", updatePopupPosition);
    window.visualViewport?.addEventListener("resize", updatePopupPosition);

    function startBubbleDrag(event) {
        if (event.button !== 0) return;

        const startLeft = bubble.offsetLeft || 0;
        const startTop = bubble.offsetTop || 0;
        dragState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startLeft,
            startTop
        };
        bubbleWasDragged = false;
        bubble.setPointerCapture?.(event.pointerId);
    }

    function moveBubbleDrag(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        const next = clampBubblePosition(dragState.startLeft + deltaX, dragState.startTop + deltaY);

        bubble.style.left = `${next.left}px`;
        bubble.style.top = `${next.top}px`;
        bubble.style.right = "auto";
        bubble.style.bottom = "auto";

        if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
            bubbleWasDragged = true;
        }

        if (popup.classList.contains("is-open")) {
            updatePopupPosition();
        }
    }

    function stopBubbleDrag(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        dragState = null;
        bubble.releasePointerCapture?.(event.pointerId);
    }

    bubble.addEventListener("pointerdown", startBubbleDrag);
    bubble.addEventListener("pointermove", moveBubbleDrag);
    bubble.addEventListener("pointerup", stopBubbleDrag);
    bubble.addEventListener("pointercancel", stopBubbleDrag);
    titleChoice.addEventListener("change", updateNewTitleVisibility);
    categoryInput.addEventListener("change", updateOtherCategoryVisibility);
    [newTitleInput, researchTitleInput, otherCategoryInput].forEach((input) => {
        input.addEventListener("input", capitalizeFirstLetter);
    });
    updateNewTitleVisibility();
    updateOtherCategoryVisibility();

    function compressImage(dataUrl) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const maxDimension = 1400;
                const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.76));
            };
            image.onerror = () => reject(new Error("This image could not be opened."));
            image.src = dataUrl;
        });
    }

    async function setScreenshot(dataUrl) {
        screenshotData = await compressImage(dataUrl);
        previewImage.src = screenshotData;
        imagePreview.hidden = false;
    }

    function summarizeResearch(text, image) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "summarizeResearch", text, image }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve({ error: "Could not reach Gemini. Check your connection and try again." });
                    return;
                }
                resolve(response || { error: "Gemini did not return a summary." });
            });
        });
    }

    function generateResearchTitle(text, image) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "generateResearchTitle", text, image }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve({ error: "Could not reach Gemini. Check your connection and try again." });
                    return;
                }
                resolve(response || { error: "Gemini did not return a research title." });
            });
        });
    }

    async function capturePageWithoutSearchlight() {
        const elements = [popup, bubble];
        const displayStates = elements.map((element) => ({
            value: element.style.getPropertyValue("display"),
            priority: element.style.getPropertyPriority("display")
        }));
        isCapturingScreenshot = true;
        elements.forEach((element) => element.style.setProperty("display", "none", "important"));
        try {
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            return await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: "captureScreenshot" }, (response) => {
                    const error = chrome.runtime.lastError?.message;
                    resolve(error ? { error } : response);
                });
            });
        } finally {
            elements.forEach((element, index) => {
                const { value, priority } = displayStates[index];
                if (value) {
                    element.style.setProperty("display", value, priority);
                } else {
                    element.style.removeProperty("display");
                }
            });
            isCapturingScreenshot = false;
        }
    }

    bubble.addEventListener("mousedown", () => {
        selectedText = window.getSelection()?.toString().trim() ?? "";
    });

    bubble.addEventListener("click", () => {
        if (bubbleWasDragged) {
            bubbleWasDragged = false;
            return;
        }

        if (bubble.classList.contains("is-hidden")) {
            bubble.classList.remove("is-hidden");
            return;
        }

        if (selectedText) {
            excerptInput.value = `"${selectedText}"`;
            selectedText = "";
        }

        popup.classList.toggle("is-open");
        if (popup.classList.contains("is-open")) {
            updatePopupPosition();
            refreshTitleChoices();
            (excerptInput.value ? excerptInput : titleChoice).focus();
        }
    });

    bubble.addEventListener("dblclick", () => {
        popup.classList.remove("is-open");
        if (isOnResearchMapPage()) {
            return;
        }
        chrome.runtime.sendMessage({ action: "openResearchMap" });
    });

    bubble.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        popup.classList.remove("is-open");

        const rect = bubble.getBoundingClientRect();
        const dockLeft = window.innerWidth - bubble.offsetWidth - 20;
        const dockTop = window.innerHeight - bubble.offsetHeight - 20;
        const isDocked = Math.abs(rect.left - dockLeft) <= 2
            && Math.abs(rect.top - dockTop) <= 2;

        if (isDocked && !bubble.classList.contains("is-hidden")) {
            bubble.classList.add("is-hidden");
            return;
        }

        resetBubblePosition();
    });

    clearFormButton.addEventListener("click", clearForm);
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error("The selected image could not be read."));
                reader.readAsDataURL(file);
            });
            await setScreenshot(dataUrl);
            setStatus("Image ready to save.");
        } catch (error) {
            setStatus(error.message, true);
        }
    });

    screenshotButton.addEventListener("click", async () => {
        screenshotButton.disabled = true;
        setStatus("Capturing this page...", false, 0);
        try {
            const response = await capturePageWithoutSearchlight();
            if (response?.error || !response?.dataUrl) {
                setStatus(response?.error || "Screenshot capture failed.", true);
                return;
            }
            await setScreenshot(response.dataUrl);
            setStatus("Screenshot ready to save.");
        } catch (error) {
            setStatus(error.message || "Screenshot capture failed.", true);
        } finally {
            screenshotButton.disabled = false;
        }
    });

    popup.querySelector(".searchlight-remove-image").addEventListener("click", () => {
        screenshotData = "";
        previewImage.removeAttribute("src");
        imagePreview.hidden = true;
        fileInput.value = "";
    });

    saveButton.addEventListener("click", async () => {
        const creatingNewTitle = titleChoice.value === createNewTitleValue;
        const groupTitleInput = newTitleInput.value.trim();
        let researchTitle = researchTitleInput.value.trim();
        if (creatingNewTitle && !groupTitleInput) {
            setStatus("Enter a title for this new category.", true);
            newTitleInput.focus();
            return;
        }
        const customResearchType = otherCategoryInput.value.trim();
        if (categoryInput.value === "Other" && !customResearchType) {
            setStatus("Enter the type of research.", true);
            otherCategoryInput.focus();
            return;
        }

        const selectedGroupId = titleChoice.value;
        const researchExcerpt = excerptInput.value.trim();
        const researchNotes = notesInput.value.trim();
        const researchImage = screenshotData;
        const researchCategoryType = categoryInput.value;
        const researchCategory = researchCategoryType === "Other"
            ? customResearchType
            : researchCategoryType;
        const summaryText = [
            researchExcerpt && `Excerpt: ${researchExcerpt}`,
            researchNotes && `Notes: ${researchNotes}`
        ].filter(Boolean).join("\n\n");
        let summary = "";
        let summaryError = "";
        let titleWasGenerated = false;

        setSavingState(true);
        if (!researchTitle) {
            const titleContext = [
                summaryText,
                document.title && `Page title: ${document.title}`,
                location.hostname && `Source website: ${location.hostname}`
            ].filter(Boolean).join("\n\n");
            setStatus("Generating a research title with Gemini...", false, 0);
            const titleResult = await generateResearchTitle(titleContext, researchImage);
            researchTitle = typeof titleResult.title === "string" ? titleResult.title.trim() : "";
            if (!researchTitle) {
                setSavingState(false);
                setStatus(titleResult.error || "Gemini could not generate a title. Enter one to save this research.", true, 10000);
                researchTitleInput.focus();
                return;
            }
            researchTitleInput.value = researchTitle;
            titleWasGenerated = true;
        }

        if (summaryText || researchImage) {
            setStatus("Generating Gemini summary...", false, 0);
            const result = await summarizeResearch(summaryText, researchImage);
            summary = result.summary || "";
            summaryError = result.error || "";
        }

        chrome.storage.local.get({ researchItems: [], researchCategories: [] }, (result) => {
            if (chrome.runtime.lastError) {
                setSavingState(false);
                setStatus(chrome.runtime.lastError.message, true);
                return;
            }

            const items = Array.isArray(result.researchItems) ? result.researchItems : [];
            const categories = Array.isArray(result.researchCategories) ? result.researchCategories : [];
            const groups = new Map();
            categories.forEach((category) => {
                if (category?.id && category?.title) groups.set(category.id, category.title);
            });
            items.forEach((savedItem) => {
                const groupId = getResearchGroupId(savedItem);
                if (!groups.has(groupId)) {
                    groups.set(groupId, savedItem.groupTitle || savedItem.title || "Untitled research");
                }
            });

            let title;
            let groupTitle;
            let groupId;
            if (creatingNewTitle) {
                if (Array.from(groups.values()).some((existingTitle) => normalizeTitle(existingTitle) === normalizeTitle(groupTitleInput))) {
                    setSavingState(false);
                    setStatus("That title already exists. Choose it from the list instead.", true);
                    refreshTitleChoices();
                    return;
                }
                groupTitle = groupTitleInput;
                groupId = `title:${normalizeTitle(groupTitle)}`;
            } else {
                groupId = selectedGroupId;
                groupTitle = groups.get(groupId);
                if (!groupTitle) {
                    setSavingState(false);
                    setStatus("That title is no longer available. Choose another title.", true);
                    refreshTitleChoices(createNewTitleValue);
                    return;
                }
            }

            const item = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                groupId,
                groupTitle,
                title: researchTitle,
                category: researchCategory,
                categoryType: researchCategoryType,
                customCategory: researchCategoryType === "Other" ? customResearchType : "",
                excerpt: researchExcerpt,
                notes: researchNotes,
                summary,
                sourceUrl: location.href,
                sourceTitle: document.title,
                screenshot: researchImage,
                createdAt: new Date().toISOString()
            };

            if (creatingNewTitle && !categories.some((category) => category.id === groupId)) {
                categories.push({
                    id: groupId,
                    title: groupTitle,
                    parentId: "",
                    researchType: researchCategory
                });
            }

            chrome.storage.local.set({
                researchItems: [item, ...items],
                researchCategories: categories
            }, () => {
                if (chrome.runtime.lastError) {
                    setSavingState(false);
                    setStatus("Could not save. Storage may be full; try removing older screenshots.", true);
                    return;
                }

                researchTitleInput.value = "";
                newTitleInput.value = "";
                titleChoice.value = createNewTitleValue;
                updateNewTitleVisibility();
                excerptInput.value = "";
                notesInput.value = "";
                categoryInput.value = "Research";
                otherCategoryInput.value = "";
                updateOtherCategoryVisibility();
                screenshotData = "";
                previewImage.removeAttribute("src");
                imagePreview.hidden = true;
                fileInput.value = "";
                setSavingState(false);
                if (summary) {
                    setStatus(titleWasGenerated
                        ? "Saved with a Gemini-generated title and summary."
                        : "Saved with a Gemini summary.");
                } else if (summaryError) {
                    setStatus(`Saved without a summary. ${summaryError}`, true, 10000);
                } else {
                    setStatus(titleWasGenerated
                        ? "Saved with a Gemini-generated title."
                        : "Saved to your research map.");
                }
                refreshTitleChoices(createNewTitleValue);
            });
        });
    });
}