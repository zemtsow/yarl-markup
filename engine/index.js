import { wrapInParagraph, parseLinks, parseImages } from './instruments.js';
let version;

async function fetchVersion() {
    try {
        const response = await fetch('./package.json');
        const data = await response.json();
        version = data.version;
        document.getElementById("version").innerText = `Version: ${data.version}`;
    } catch (error) {
        console.error("Failed to load version:", error);
    }
}

fetchVersion();



let typingTimer;
const delay = 2000;
const inputField = document.getElementById("markupInput");
const previewField = document.getElementById("preview");

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            insertImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById("saveHtmlButton").addEventListener("click", function () {
    const fileName = document.getElementById("fileNameInput").value.trim() || "result";
    saveAsHtml(fileName);
});

inputField.addEventListener("input", function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        checkForImageUpload();
        renderMarkup();
    }, delay);
});

function checkForImageUpload() {
    let inputText = inputField.value;
    if (inputText.includes("!img >")) {
        inputField.value = inputText.replace("!img >", "");
        fileInput.click();
    }
}

function renderMarkup() {
    previewField.innerHTML = parseYarlMarkup(inputField.value);
    attachImageClickEvents();
}

function insertImage(base64) {
    const marker = `[Uploaded Image ${Date.now()}]`;
    localStorage.setItem(marker, base64);
    inputField.value += `\n${marker}\n`;
    renderMarkup();
}

function parseYarlMarkup(text) {
    const lines = text.split("\n");
    let html = "";
    let inQuote = false;

    lines.forEach((line) => {
        line = line.trim();

        if (line.startsWith(">")) {
            if (!inQuote) {
                html += `<blockquote class="yarl-quote">`;
                inQuote = true;
            }
            html += `<p>${parseImages(parseLinks(line.substring(1).trim()))}</p>`;
        } else if (line === "<" && inQuote) {
            html += `</blockquote>`;
            inQuote = false;
        } else if (line.startsWith("[Uploaded Image")) {
            const base64 = localStorage.getItem(line);
            if (base64) {
                html += `<img src="${base64}" class="yarl-image" data-marker="${line}" />`;
            }
        } else {
            if (inQuote) {
                html += `<p>${parseImages(parseLinks(line))}</p>`;
            } else {
                html += wrapInParagraph(parseImages(line));
            }
        }
    });

    return html;
}

function attachImageClickEvents() {
    document.querySelectorAll(".yarl-image").forEach(img => {
        img.addEventListener("click", function () {
            showModal(this.getAttribute("src"));
        });
    });
}

function showModal(imageSrc) {
    let modal = document.getElementById("imageModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "imageModal";
        modal.className = "modal";
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <p>Image Path:</p>
                <input type="text" value="${imageSrc}" readonly>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector(".close").addEventListener("click", () => {
            modal.style.display = "none";
        });
    } else {
        modal.querySelector("input").value = imageSrc;
        modal.style.display = "block";
    }
}

function saveAsHtml(fileName) {
    const content = document.getElementById("preview").innerHTML;
    const styles = getInlineStyles();
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <style>
        ${styles}
    </style>
</head>
<body>
    ${content}

    <footer style="text-align: center; margin-top: 40px; padding: 10px; font-size: 14px; color: #666;">
        Powered by <strong>Yarl Markup</strong> |
        <a href="https://github.com/zemtsow/yarl-markup" target="_blank" style="color: #2185d0; text-decoration: none;">
            GitHub Repository
        </a>
        version ${version}
    </footer>
</body>
</html>
    `;
    downloadFile(`${fileName}.html`, fullHtml);
}


function getInlineStyles() {
    return `
        body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; background: #f9f9f9; }
        .yarl-quote { font-style: italic; border-left: 4px solid #2185d0; padding-left: 10px; color: #555; margin: 10px 0; }
        .yarl-quote p { margin: 5px 0; }
        .yarl-image { max-width: 100%; height: auto; display: block; margin: 10px 0; }
    `;
}

function downloadFile(fileName, content) {
    const blob = new Blob([content], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
