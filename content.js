const RANDOM_CODE_COMMAND = '/n';
const RANDOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const RANDOM_CODE_LENGTH = 6;

function generateRandomCode() {
    let code = '';

    for (let i = 0; i < RANDOM_CODE_LENGTH; i++) {
        code += RANDOM_CODE_CHARS[Math.floor(Math.random() * RANDOM_CODE_CHARS.length)];
    }

    return code;
}

function getEditableElement(element) {
    if (!element) {
        return null;
    }

    if (element.isContentEditable) {
        return element;
    }

    return element.closest?.('[contenteditable="true"]') || element;
}

function isTextInput(element) {
    if (!element) {
        return false;
    }

    const ignoredInputTypes = ['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'];
    const textInputTypes = ['', 'text', 'email', 'search', 'url', 'tel', 'password'];
    if (element.tagName === 'INPUT') {
        return textInputTypes.includes(element.type) || !ignoredInputTypes.includes(element.type);
    }

    return (element.tagName === 'INPUT' && textInputTypes.includes(element.type)) || element.tagName === 'TEXTAREA' || element.isContentEditable;
}

function setTextInputValue(inputElement, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(inputElement, 'value')?.set;
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inputElement), 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(inputElement, value);
    } else if (valueSetter) {
        valueSetter.call(inputElement, value);
    } else {
        inputElement.value = value;
    }

    inputElement.focus();
    inputElement.setSelectionRange?.(value.length, value.length);
    inputElement.dispatchEvent(new Event('input', {bubbles: true}));
    inputElement.dispatchEvent(new Event('change', {bubbles: true}));
}

function setEditableValue(element, value) {
    if (element.isContentEditable) {
        element.textContent = value;
        element.focus();
        element.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: value}));
        element.dispatchEvent(new Event('change', {bubbles: true}));
        return;
    }

    setTextInputValue(element, value);
}

function getEditableValue(element) {
    return element.isContentEditable ? element.textContent : element.value;
}

function replaceRandomCodeCommand(element) {
    element = getEditableElement(element);

    if (!isTextInput(element) || getEditableValue(element).trim().toLowerCase() !== RANDOM_CODE_COMMAND) {
        return;
    }

    setEditableValue(element, generateRandomCode());
}

document.addEventListener('input', (event) => {
    replaceRandomCodeCommand(event.target);
}, true);

document.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() === 'n') {
        replaceRandomCodeCommand(event.target);
    }
}, true);
