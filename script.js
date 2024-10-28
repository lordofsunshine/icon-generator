const prompt = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const iconContainer = document.getElementById('iconContainer');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const styleOptions = document.getElementById('styleOptions');
const colorPicker = document.getElementById('colorPicker');
const customColorPicker = document.getElementById('customColorPicker');
const iconSize = document.getElementById('iconSize');
const iconFilter = document.getElementById('iconFilter');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const loadSettingsBtn = document.getElementById('loadSettingsBtn');
const toast = document.getElementById('toast');

let currentStyle = 'shapes';
let currentColor = '#3498db';
let userSelectedColor = false;

function getSubtleBackgroundColor(hexColor) {
    const rgb = parseInt(hexColor.slice(1), 16);
    let r = (rgb >> 16) & 0xff;
    let g = (rgb >> 8) & 0xff;
    let b = rgb & 0xff;

    r = Math.floor((r + 255 * 2) / 3);
    g = Math.floor((g + 255 * 2) / 3);
    b = Math.floor((b + 255 * 2) / 3);

    const maxBrightness = 220;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness > maxBrightness) {
        const factor = maxBrightness / brightness;
        r = Math.floor(r * factor);
        g = Math.floor(g * factor);
        b = Math.floor(b * factor);
    }

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function generateIcon(seed = prompt.value) {
    let apiUrl = `https://api.dicebear.com/7.x/${currentStyle}/svg?seed=${encodeURIComponent(seed)}`;

    if (userSelectedColor) {
        apiUrl += `&backgroundColor=${encodeURIComponent(currentColor.slice(1))}`;
    }

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(svgContent => {
            iconContainer.innerHTML = svgContent;
            if (!userSelectedColor) {
                const dominantColor = getDominantColor(svgContent);
                const subtleBackgroundColor = getSubtleBackgroundColor(dominantColor);
                iconContainer.style.backgroundColor = subtleBackgroundColor;
                currentColor = subtleBackgroundColor;
                customColorPicker.value = subtleBackgroundColor;
            } else {
                iconContainer.style.backgroundColor = currentColor;
            }
            animateIcon();
        })
        .catch(error => {
            console.error('Error:', error);
            iconContainer.innerHTML = 'Error generating icon. Please try again.';
            iconContainer.classList.add('shake');
            setTimeout(() => {
                iconContainer.classList.remove('shake');
            }, 500);
        });
}

function getDominantColor(svgContent) {
    const colorMatch = svgContent.match(/#[0-9A-Fa-f]{6}/);
    return colorMatch ? colorMatch[0] : '#000000';
}

function animateIcon() {
    iconContainer.style.transform = 'scale(0.8)';
    iconContainer.style.opacity = '0';
    setTimeout(() => {
        iconContainer.style.transform = 'scale(1)';
        iconContainer.style.opacity = '1';
    }, 50);
}

function showToast(message) {
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

function sanitizeInput(input) {
    return input.replace(/[<>&'"]/g, function(c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&#39;';
            case '"': return '&quot;';
        }
    });
}

generateBtn.addEventListener('click', () => {
    if (prompt.value.trim() === '') {
        showToast('Please enter a description for your icon.');
        return;
    }
    generateIcon(sanitizeInput(prompt.value));
});

downloadBtn.addEventListener('click', () => {
    const svgContent = iconContainer.innerHTML;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creative-icon.svg';
    document.body.appendChild(a);

    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Icon downloaded successfully!');
});

copyBtn.addEventListener('click', () => {
    const svgContent = iconContainer.innerHTML;
    const minifiedSvg = svgContent.replace(/>\s+</g, '><').trim();
    navigator.clipboard.writeText(minifiedSvg).then(() => {
        showToast('SVG code copied to clipboard!');
    }, (err) => {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy SVG code.');
    });
});

randomizeBtn.addEventListener('click', () => {
    const randomWords = ['Creative', 'Innovative', 'Dynamic', 'Vibrant', 'Elegant', 'Sleek', 'Modern', 'Futuristic', 'Artistic', 'Inspiring'];
    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    prompt.value = randomWord;
    generateIcon(randomWord);
});

styleOptions.addEventListener('click', (e) => {
    if (e.target.classList.contains('style-option')) {
        currentStyle = e.target.dataset.style;
        document.querySelectorAll('.style-option').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        generateIcon();
    }
});

colorPicker.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-option')) {
        currentColor = e.target.dataset.color;
        customColorPicker.value = currentColor;
        userSelectedColor = true;
        generateIcon();
    }
});

customColorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    userSelectedColor = true;
    generateIcon();
});

iconSize.addEventListener('input', (e) => {
    iconContainer.style.width = `${e.target.value}px`;
    iconContainer.style.height = `${e.target.value}px`;
});

iconFilter.addEventListener('change', (e) => {
    iconContainer.style.filter = e.target.value;
});

function saveIconSettings() {
    const settings = {
        prompt: prompt.value,
        style: currentStyle,
        color: currentColor,
        size: iconSize.value,
        filter: iconFilter.value
    };
    localStorage.setItem('iconSettings', JSON.stringify(settings));
    showToast('Icon settings saved!');
}

function loadIconSettings() {
    const savedSettings = localStorage.getItem('iconSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        prompt.value = settings.prompt;
        currentStyle = settings.style;
        currentColor = settings.color;
        iconSize.value = settings.size;
        iconFilter.value = settings.filter;
        generateIcon(settings.prompt);
        iconContainer.style.width = `${settings.size}px`;
        iconContainer.style.height = `${settings.size}px`;
        iconContainer.style.filter = settings.filter;
        showToast('Saved icon settings loaded!');
    } else {
        showToast('No saved settings found.');
    }
}

saveSettingsBtn.addEventListener('click', saveIconSettings);
loadSettingsBtn.addEventListener('click', loadIconSettings);

generateIcon('CreativeIcon');

const secretWord = 'dicebear';
let typedWord = '';

document.addEventListener('keydown', (e) => {
    typedWord += e.key.toLowerCase();
    if (typedWord.length > secretWord.length) {
        typedWord = typedWord.slice(-secretWord.length);
    }
    if (typedWord === secretWord) {
        activateEasterEgg();
        typedWord = '';
    }
});

function activateEasterEgg() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    let colorIndex = 0;
    let rotationAngle = 0;

    function changeColorAndRotate() {
        document.body.style.backgroundColor = colors[colorIndex];
        colorIndex = (colorIndex + 1) % colors.length;

        rotationAngle += 15;
        document.body.style.transform = `rotate(${rotationAngle}deg)`;

        iconContainer.style.transform = `scale(${1 + Math.sin(rotationAngle * Math.PI / 180) * 0.2})`;
    }

    const interval = setInterval(changeColorAndRotate, 200);
    showToast('Easter egg activated! Enjoy the wild ride!');

    setTimeout(() => {
        clearInterval(interval);
        document.body.style.backgroundColor = '';
        document.body.style.transform = '';
        iconContainer.style.transform = '';
        showToast('Easter egg deactivated. Hope you enjoyed the show!');
    }, 10000);
}

function rateLimit(func, limit, interval) {
    let calls = 0;
    let lastReset = Date.now();

    return function(...args) {
        const now = Date.now();
        if (now - lastReset > interval) {
            calls = 0;
            lastReset = now;
        }
        if (calls >= limit) {
            showToast('Too many requests. Please wait a moment.');
            return;
        }
        calls++;
        return func.apply(this, args);
    };
}

generateBtn.addEventListener('click', rateLimit(() => {
    if (prompt.value.trim() === '') {
        showToast('Please enter a description for your icon.');
        return;
    }
    generateIcon(sanitizeInput(prompt.value));
}, 5, 10000));

prompt.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[<>&]/g, '');
});