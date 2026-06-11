const RANDOM_CODE_COMMAND = '@n';
const RANDOM_EMAIL_COMMAND = '@e';
const LATEST_CODE_COMMAND = '@w';
const CONTACT_FORM_COMMAND = '@u';
const BUILDER_FORM_COMMAND = '@b';
const PROJECT_FORM_COMMAND = '@p';
const REMODELING_FORM_COMMAND = '@r';
const DEALER_FORM_COMMAND = '@d';
const GENERAL_CONTRACTOR_FORM_COMMAND = '@g';
const OWNER_DEVELOPER_FORM_COMMAND = '@o';
const LOCATION_FORM_COMMAND = '@l';
const RANDOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const RANDOM_CODE_LENGTH = 6;
const EMAIL_DOMAIN = '@vy.le.com';
const DEFAULT_PHONE = '1234567899';
const BUILDER_NAME_PREFIX = 'Buidler Vy Le';
const DEALER_NAME_PREFIX = 'Dealer Vy Le';
const GENERAL_CONTRACTOR_NAME_PREFIX = 'General Contractor Vy Le';
const OWNER_DEVELOPER_NAME_PREFIX = 'Owner Developer Vy Le';
const PROJECT_NAME_PREFIX = 'Project Vy Le';
const REMODELING_NAME_PREFIX = 'Remodeling Vy Le';
const LOCATION_NAME_PREFIX = 'Location Vy Le';
let latestRandomCode = '';

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

function isFillableField(element) {
    return isTextInput(element) || element?.tagName === 'SELECT';
}

function dispatchValueEvents(element) {
    element.dispatchEvent(new Event('input', {bubbles: true}));
    element.dispatchEvent(new Event('change', {bubbles: true}));
    element.dispatchEvent(new Event('blur', {bubbles: true}));
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
    dispatchValueEvents(inputElement);
}

function setSelectValue(selectElement) {
    const option = Array.from(selectElement.options).find((item) => !item.disabled && item.value) || selectElement.options[0];

    if (!option) {
        return;
    }

    const valueSetter = Object.getOwnPropertyDescriptor(selectElement, 'value')?.set;
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(selectElement), 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(selectElement, option.value);
    } else if (valueSetter) {
        valueSetter.call(selectElement, option.value);
    } else {
        selectElement.value = option.value;
    }

    selectElement.focus();
    dispatchValueEvents(selectElement);
}

function setCheckboxChecked(checkboxElement) {
    if (checkboxElement.checked) {
        return;
    }

    const checkedSetter = Object.getOwnPropertyDescriptor(checkboxElement, 'checked')?.set;
    const prototypeCheckedSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(checkboxElement), 'checked')?.set;

    if (prototypeCheckedSetter && checkedSetter !== prototypeCheckedSetter) {
        prototypeCheckedSetter.call(checkboxElement, true);
    } else if (checkedSetter) {
        checkedSetter.call(checkboxElement, true);
    } else {
        checkboxElement.checked = true;
    }

    dispatchValueEvents(checkboxElement);
}

function setEditableValue(element, value) {
    if (element.tagName === 'SELECT') {
        setSelectValue(element);
        return;
    }

    if (element.isContentEditable) {
        element.textContent = value;
        element.focus();
        element.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: value}));
        dispatchValueEvents(element);
        return;
    }

    setTextInputValue(element, value);
}

function getEditableValue(element) {
    return element.isContentEditable ? element.textContent || '' : element.value || '';
}

function normalizeText(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getFieldText(element) {
    const parts = [
        element.getAttribute?.('aria-label'),
        element.getAttribute?.('placeholder'),
        element.getAttribute?.('name'),
        element.getAttribute?.('id'),
        element.getAttribute?.('autocomplete'),
    ];

    if (element.id) {
        const escapedId = window.CSS?.escape ? CSS.escape(element.id) : element.id.replace(/"/g, '\\"');
        const label = document.querySelector(`label[for="${escapedId}"]`);
        parts.push(label?.textContent);
    }

    parts.push(element.closest?.('label')?.textContent);

    return normalizeText(parts.filter(Boolean).join(' '));
}

function fieldMatches(element, names) {
    const fieldText = getFieldText(element);
    return names.some((name) => fieldText.includes(normalizeText(name)));
}

function getFormScope(element) {
    return element.closest?.('form') || document;
}

function getFillableFields(scope) {
    return Array.from(scope.querySelectorAll('input, textarea, select, [contenteditable="true"]')).filter(isFillableField);
}

function findField(scope, names) {
    const fields = getFillableFields(scope);
    const fieldByMeta = fields.find((field) => fieldMatches(field, names));

    if (fieldByMeta) {
        return fieldByMeta;
    }

    const label = Array.from(scope.querySelectorAll('label')).find((item) => {
        return names.some((name) => normalizeText(item.textContent).includes(normalizeText(name)));
    });

    const labelField = label?.control || label?.querySelector?.('input, textarea, select, [contenteditable="true"]');
    if (labelField) {
        return labelField;
    }

    const wrapper = Array.from(scope.querySelectorAll('div, section, fieldset, li, td')).find((item) => {
        return names.some((name) => normalizeText(item.textContent).includes(normalizeText(name))) && item.querySelector('input, textarea, select, [contenteditable="true"]');
    });

    return wrapper?.querySelector?.('input, textarea, select, [contenteditable="true"]') || null;
}

function findNextFieldAfter(scope, field) {
    const fields = getFillableFields(scope);
    const currentIndex = fields.indexOf(field);

    if (currentIndex === -1) {
        return null;
    }

    return fields.slice(currentIndex + 1).find((item) => item !== field) || null;
}

function selectFirstOptions(scope) {
    Array.from(scope.querySelectorAll('select')).forEach(setSelectValue);
}

function checkAllCheckboxes(scope) {
    Array.from(scope.querySelectorAll('input[type="checkbox"]')).forEach(setCheckboxChecked);
}

function fillFieldIfPresent(field, value) {
    if (field) {
        setEditableValue(field, value);
    }
}

function fillCommonEntityFormFromName(element, namePrefix, nameAliases = ['name']) {
    const scope = getFormScope(element);
    const nameField = findField(scope, nameAliases);

    if (nameField !== element) {
        return false;
    }

    latestRandomCode = generateRandomCode();
    const emailField = findField(scope, ['email']);
    const phoneField = findField(scope, ['phone', 'phone number', 'phonenumber', 'mobile', 'mobile phone', 'telephone', 'tel']);

    setEditableValue(nameField, `${namePrefix} ${latestRandomCode}`);
    fillFieldIfPresent(findField(scope, ['address line 1', 'addressline1', 'address 1', 'address1']), latestRandomCode);
    fillFieldIfPresent(findField(scope, ['address line 2', 'addressline2', 'address 2', 'address2']), latestRandomCode);
    fillFieldIfPresent(findField(scope, ['city']), latestRandomCode);
    fillFieldIfPresent(findField(scope, ['zip/postal code', 'zip postal code', 'postal code', 'zipcode', 'zip']), latestRandomCode);
    fillFieldIfPresent(emailField, `${latestRandomCode}${EMAIL_DOMAIN}`);
    fillFieldIfPresent(phoneField || findNextFieldAfter(scope, emailField), DEFAULT_PHONE);
    selectFirstOptions(scope);
    return true;
}

function autofillContactFormFromFirstName(element) {
    const scope = getFormScope(element);
    const firstNameField = findField(scope, ['first name', 'firstname']);

    if (firstNameField !== element) {
        return false;
    }

    const fields = {
        firstName: firstNameField,
        lastName: findField(scope, ['last name', 'lastname']),
        title: findField(scope, ['title']),
        email: findField(scope, ['email']),
        phone: findField(scope, ['phone', 'phone number', 'phonenumber', 'mobile', 'mobile phone', 'telephone', 'tel']),
    };

    fields.phone = fields.phone || findNextFieldAfter(scope, fields.email);

    if (!fields.lastName || !fields.title || !fields.email || !fields.phone) {
        return false;
    }

    latestRandomCode = generateRandomCode();
    setEditableValue(fields.firstName, latestRandomCode);
    setEditableValue(fields.lastName, latestRandomCode);
    setEditableValue(fields.title, latestRandomCode);
    setEditableValue(fields.email, `${latestRandomCode}${EMAIL_DOMAIN}`);
    setEditableValue(fields.phone, DEFAULT_PHONE);
    checkAllCheckboxes(scope);
    return true;
}

function autofillBuilderFormFromName(element) {
    return fillCommonEntityFormFromName(element, BUILDER_NAME_PREFIX, ['name', 'builder name', 'buildername']);
}

function getReplacementValue(command) {
    if (command === RANDOM_CODE_COMMAND) {
        latestRandomCode = generateRandomCode();
        return latestRandomCode;
    }

    if (command === RANDOM_EMAIL_COMMAND) {
        latestRandomCode = latestRandomCode || generateRandomCode();
        return `${latestRandomCode}${EMAIL_DOMAIN}`;
    }

    if (command === LATEST_CODE_COMMAND) {
        latestRandomCode = latestRandomCode || generateRandomCode();
        return latestRandomCode;
    }

    return null;
}

function replaceCommand(element) {
    element = getEditableElement(element);

    if (!isTextInput(element)) {
        return;
    }

    const command = String(getEditableValue(element)).trim().toLowerCase();
    if (command === CONTACT_FORM_COMMAND && autofillContactFormFromFirstName(element)) {
        return;
    }

    if (command === BUILDER_FORM_COMMAND && autofillBuilderFormFromName(element)) {
        return;
    }

    if (command === PROJECT_FORM_COMMAND && fillCommonEntityFormFromName(element, PROJECT_NAME_PREFIX, ['name', 'project name', 'projectname'])) {
        return;
    }

    if (command === REMODELING_FORM_COMMAND && fillCommonEntityFormFromName(element, REMODELING_NAME_PREFIX, ['name', 'remodeling name', 'remodelingname'])) {
        return;
    }

    if (command === DEALER_FORM_COMMAND && fillCommonEntityFormFromName(element, DEALER_NAME_PREFIX, ['name', 'dealer name', 'dealername'])) {
        return;
    }

    if (command === GENERAL_CONTRACTOR_FORM_COMMAND && fillCommonEntityFormFromName(element, GENERAL_CONTRACTOR_NAME_PREFIX, ['name', 'general contractor name', 'generalcontractorname', 'gc name', 'gcname'])) {
        return;
    }

    if (command === OWNER_DEVELOPER_FORM_COMMAND && fillCommonEntityFormFromName(element, OWNER_DEVELOPER_NAME_PREFIX, ['name', 'owner developer name', 'ownerdevelopername', 'od name', 'odname'])) {
        return;
    }

    if (command === LOCATION_FORM_COMMAND && fillCommonEntityFormFromName(element, LOCATION_NAME_PREFIX, ['name', 'location name', 'locationname'])) {
        return;
    }

    const replacementValue = getReplacementValue(command);
    if (replacementValue) {
        setEditableValue(element, replacementValue);
    }
}

document.addEventListener('input', (event) => {
    replaceCommand(event.target);
}, true);
