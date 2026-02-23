// State Management
const state = {
    autoCopy: true,
    autoClear: false,
    history: JSON.parse(localStorage.getItem('caseHistory')) || [],
    selectedPrefix: 'Mr.'
};

// DOM Elements
const elements = {
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Mode 1
    input1: document.getElementById('text-input-1'),
    actions1: document.querySelectorAll('.action-btn[data-action]'),
    autoCopyToggle: document.getElementById('auto-copy-toggle'),
    autoClearToggle: document.getElementById('auto-clear-toggle'),
    previewBox1: document.getElementById('live-preview-1'),
    previewSection1: document.getElementById('preview-section-1'),
    historyList: document.getElementById('history-list'),
    copyPreviewBtn: document.getElementById('copy-preview-btn'),

    // Mode 2
    prefixBtns: document.querySelectorAll('.prefix-btn'),
    nameInput: document.getElementById('name-input'),
    generatePrefixBtn: document.getElementById('generate-prefix-btn'),

    // Toast
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg')
};

// Initialize
function init() {
    setupEventListeners();
    renderHistory();
    // Set initial prefix visually
    updatePrefixSelection();
    startBrandAnimation();
    initCookieBanner();
}

// Event Listeners
function setupEventListeners() {
    // Tab switching
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.target));
    });

    // Global Toggles
    elements.autoCopyToggle.addEventListener('change', (e) => {
        state.autoCopy = e.target.checked;
    });
    elements.autoClearToggle.addEventListener('change', (e) => {
        state.autoClear = e.target.checked;
    });

    // Mode 1 Conversions
    elements.actions1.forEach(btn => {
        btn.addEventListener('click', () => handleMode1Action(btn.dataset.action, btn.textContent));
    });

    elements.input1.addEventListener('input', () => {
        if (elements.input1.value.trim() === '') {
            elements.previewSection1.classList.add('hidden');
        } else {
            // Just show preview if they are typing, we don't auto convert until button click typically, 
            // but user requested live preview. Let's make the preview show the current text.
            elements.previewSection1.classList.remove('hidden');
            elements.previewBox1.textContent = elements.input1.value;
        }
    });

    elements.copyPreviewBtn.addEventListener('click', () => {
        if (elements.previewBox1.textContent) {
            copyToClipboard(elements.previewBox1.textContent);
        }
    });

    // Mode 2 Prefix Selection
    elements.prefixBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.selectedPrefix = btn.dataset.prefix;
            updatePrefixSelection();

            // Auto format if input has value
            if (elements.nameInput.value.trim() !== '') {
                handleMode2Action();
            }
        });
    });

    // Mode 2 Action
    elements.generatePrefixBtn.addEventListener('click', handleMode2Action);

    // Mode 2 Enter key
    elements.nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleMode2Action();
    });
}

function switchTab(targetId) {
    elements.tabs.forEach(tab => tab.classList.remove('active'));
    elements.tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab-btn[data-target="${targetId}"]`).classList.add('active');
    document.getElementById(targetId).classList.add('active');
}

// ==== Actions ====

function handleMode1Action(action, caseName) {
    const text = elements.input1.value;
    if (!text) return;

    let result = '';
    switch (action) {
        case 'uppercase': result = text.toUpperCase(); break;
        case 'lowercase': result = text.toLowerCase(); break;
        case 'sentencecase': result = toSentenceCase(text); break;
        case 'titlecase': result = toTitleCase(text); break;
        case 'togglecase': result = toToggleCase(text); break;
        case 'camelcase': result = toCamelCase(text); break;
        case 'snakecase': result = toSnakeCase(text); break;
        case 'kebabcase': result = toKebabCase(text); break;
        case 'reversecase': result = text.split('').reverse().join(''); break;
    }

    // Update Output/Preview
    elements.previewSection1.classList.remove('hidden');
    elements.previewBox1.textContent = result;

    // Optionally update the input field itself
    elements.input1.value = state.autoClear ? '' : result;

    if (state.autoClear) {
        elements.previewSection1.classList.add('hidden');
    }

    if (state.autoCopy) {
        copyToClipboard(result);
    }

    addToHistory(result, caseName);
}

function handleMode2Action() {
    const val = elements.nameInput.value.trim();
    if (!val) {
        showToast("Please enter a name first", true);
        return;
    }

    // Title case the name
    const titleCasedName = toTitleCase(val);

    // Combine with Prefix
    const result = `${state.selectedPrefix} ${titleCasedName}`;

    // Auto Copy based on state
    if (state.autoCopy) {
        copyToClipboard(result);
    }
    addToHistory(result, 'Prefix Mode');

    // Auto Clear based on state
    if (state.autoClear) {
        elements.nameInput.value = '';
    }
}

function updatePrefixSelection() {
    elements.prefixBtns.forEach(btn => {
        if (btn.dataset.prefix === state.selectedPrefix) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// ==== Conversion Algorithms ====

function toSentenceCase(str) {
    return str.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (c) {
        return c.toUpperCase();
    });
}

function toTitleCase(str) {
    const minorWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of'];
    return str.toLowerCase().replace(/\b\w+/g, function (word, index) {
        if (index === 0 || !minorWords.includes(word)) {
            return word.charAt(0).toUpperCase() + word.substr(1);
        }
        return word;
    });
}

function toToggleCase(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === c.toUpperCase()) {
            result += c.toLowerCase();
        } else {
            result += c.toUpperCase();
        }
    }
    return result;
}

function toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

function toSnakeCase(str) {
    return str.replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_');
}

function toKebabCase(str) {
    return toSnakeCase(str).replace(/_/g, '-');
}

// ==== Utilities ====

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!");
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast("Copied to clipboard!");
        } catch (err) {
            showToast("Failed to copy", true);
        }
        document.body.removeChild(textArea);
    }
}

let toastTimeout;
function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    elements.toastMsg.textContent = message;

    // Change icon color if error
    const svg = elements.toast.querySelector('svg');
    if (isError) {
        svg.style.color = '#ef4444'; // Red
        svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        elements.toast.style.borderColor = '#ef4444';
    } else {
        svg.style.color = 'var(--clr-success)';
        svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        elements.toast.style.borderColor = 'var(--clr-primary-500)';
    }

    elements.toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2500);
}

// ==== History ====

function addToHistory(text, type) {
    // Prevent empty history
    if (!text.trim()) return;

    // Prevent duplicates acting back to back
    if (state.history.length > 0 && state.history[0].text === text) return;

    state.history.unshift({ text, type, time: Date.now() });

    // Keep only last 5
    if (state.history.length > 5) {
        state.history.pop();
    }

    localStorage.setItem('caseHistory', JSON.stringify(state.history));
    renderHistory();
}

function renderHistory() {
    elements.historyList.innerHTML = '';

    if (state.history.length === 0) {
        elements.historyList.innerHTML = '<li class="history-empty">No recent conversions (Last 5)</li>';
        return;
    }

    state.history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';

        const textSpan = document.createElement('span');
        textSpan.className = 'history-text';
        textSpan.textContent = item.text;

        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'history-badge';
        badgeSpan.textContent = item.type;

        li.appendChild(textSpan);
        li.appendChild(badgeSpan);

        // Click to copy history item
        li.style.cursor = 'pointer';
        li.title = 'Click to copy again';
        li.addEventListener('click', () => {
            copyToClipboard(item.text);
        });

        elements.historyList.appendChild(li);
    });
}

// ==== Brand Animation ====
function startBrandAnimation() {
    const w1 = document.getElementById('brand-w1');
    if (!w1) return;

    // Animate "Case Convertor" letter cases every 1.5s
    setInterval(() => {
        let toggled = '';
        const current = w1.textContent;
        for (let i = 0; i < current.length; i++) {
            let char = current[i];
            if (char === char.toUpperCase()) {
                toggled += char.toLowerCase();
            } else {
                toggled += char.toUpperCase();
            }
        }
        w1.textContent = toggled;
    }, 1500);
}

// ==== Cookie Banner ====
function initCookieBanner() {
    if (localStorage.getItem('cookieConsent')) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            We use cookies to enhance your experience and deliver personalized ads. By continuing to visit this site you agree to our use of cookies. <br>
            <a href="cookies.html">Learn more</a> | <a href="privacy.html">Privacy Policy</a>
        </div>
        <div class="cookie-actions">
            <button class="cookie-btn accept" id="accept-cookies">Accept</button>
        </div>
    `;

    document.body.appendChild(banner);

    // Show banner after a slight delay
    setTimeout(() => {
        banner.classList.add('show');
    }, 1000);

    document.getElementById('accept-cookies').addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'true');
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 300); // Wait for transition
    });
}

// Boot up
document.addEventListener('DOMContentLoaded', init);
