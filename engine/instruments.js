function wrapInQuote(text) {
    return `<blockquote class="yarl-quote"><p>${parseLinks(text)}</p>`;
}

function wrapInParagraph(text) {
    return `<p>${parseLinks(text)}</p>`;
}

function parseLinks(text) {
    return text.replace(/!(.*?)\s*-\s*(https?:\/\/\S+)/g, '<a href="$2" target="_blank">$1</a>');
}

function parseImages(text) {
    return text.replace(/!img\s*=\s*(https?:\/\/\S+)/g, '<img src="$1" alt="Image" class="yarl-image" />');
}

export {
    wrapInQuote,
    wrapInParagraph,
    parseLinks,
    parseImages,
}