import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

let fieldCounter = 0;

function nextFieldId() {
  fieldCounter += 1;
  return `ps-field-${fieldCounter}`;
}

/**
 * CMP-11 — FormField + CMP-12 — TextInput.
 * La etiqueta, la ayuda y el error quedan asociados por id y aria-describedby.
 */
export function createField({
  id = nextFieldId(),
  name = '',
  label = '',
  type = 'text',
  value = '',
  placeholder = '',
  autocomplete = 'off',
  inputmode = '',
  maxlength = '',
  required = false,
  optional = false,
  requiredMark = false,
  help = '',
  icon = '',
  action = null,
  onInput = null,
  onKeyDown = null,
  onKeyUp = null,
  onBlur = null,
} = {}) {
  const messageId = `${id}-message`;
  const helpId = `${id}-help`;
  const describedBy = [help ? helpId : '', messageId].filter(Boolean).join(' ');

  const input = h('input', {
    class: 'ps-field__input',
    id,
    name: name || null,
    type,
    value,
    placeholder: placeholder || null,
    autocomplete,
    inputmode: inputmode || null,
    maxlength: maxlength || null,
    required,
    attrs: {
      'aria-describedby': describedBy,
    },
  });

  const messageElement = h('p', {
    class: 'ps-field__message',
    id: messageId,
    attrs: { role: 'alert' },
  });

  const helpElement = help ? h('p', { class: 'ps-field__help', id: helpId, text: help }) : null;

  const iconElement = icon
    ? h(
        'span',
        { class: 'ps-field__icon', attrs: { 'aria-hidden': 'true' } },
        createIcon(icon, { size: 20 }),
      )
    : null;

  const controlClasses = ['ps-field__control'];

  if (icon) {
    controlClasses.push('ps-field__control--with-icon');
  }

  if (action) {
    controlClasses.push('ps-field__control--with-action');
  }

  const control = h('div', { class: controlClasses.join(' ') }, iconElement, input, action);

  const labelElement = label
    ? h(
        'label',
        { class: 'ps-field__label', for: id },
        label,
        requiredMark ? h('span', { class: 'ps-field__required', text: ' (obligatorio)' }) : null,
        optional ? h('span', { class: 'ps-field__optional', text: ' (opcional)' }) : null,
      )
    : null;

  const element = h(
    'div',
    { class: 'ps-field', id: `${id}-field` },
    labelElement,
    control,
    helpElement,
    messageElement,
  );

  function setError(message = '') {
    element.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    messageElement.textContent = message;
  }

  function clearError() {
    element.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    messageElement.textContent = '';
  }

  function setValue(next) {
    input.value = next;
  }

  function setDisabled(next) {
    input.disabled = next;
    element.classList.toggle('is-disabled', next);
  }

  function setInvalid(next) {
    element.classList.toggle('is-invalid', next);
    input.setAttribute('aria-invalid', String(next));

    if (!next) {
      messageElement.textContent = '';
    }
  }

  if (onInput) {
    input.addEventListener('input', onInput);
  }

  if (onKeyDown) {
    input.addEventListener('keydown', onKeyDown);
  }

  if (onKeyUp) {
    input.addEventListener('keyup', onKeyUp);
  }

  if (onBlur) {
    input.addEventListener('blur', onBlur);
  }

  return {
    element,
    input,
    messageElement,
    setError,
    setInvalid,
    clearError,
    setValue,
    getValue: () => input.value,
    setDisabled,
    focus: () => input.focus(),
  };
}

/**
 * CMP-13 — PasswordInput.
 * Reutiliza TextInput y agrega el botón Mostrar/Ocultar con aria-pressed.
 */
export function createPasswordField(options = {}) {
  let field = null;

  const toggle = h('button', {
    class: 'ps-field__toggle',
    type: 'button',
    attrs: {
      'aria-pressed': 'false',
      'aria-label': 'Mostrar contraseña',
    },
  });
  toggle.textContent = 'Mostrar';

  toggle.addEventListener('click', () => {
    if (!field) {
      return;
    }

    const visible = field.input.type === 'text';
    field.input.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'Mostrar' : 'Ocultar';
    toggle.setAttribute('aria-pressed', String(!visible));
    toggle.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    field.input.focus({ preventScroll: true });

    const length = field.input.value.length;
    field.input.setSelectionRange(length, length);
  });

  field = createField({
    ...options,
    type: 'password',
    icon: options.icon || 'lock',
    action: toggle,
  });

  toggle.setAttribute('aria-controls', field.input.id);

  return { ...field, toggle };
}

/**
 * CMP-17 — Checkbox.
 * Se usa para "Mantener sesión iniciada"; conserva el objetivo táctil de 44 px.
 */
export function createCheckbox({
  id = nextFieldId(),
  name = '',
  label = '',
  checked = false,
  onChange = null,
} = {}) {
  const input = h('input', {
    type: 'checkbox',
    id,
    name,
    checked,
  });
  input.checked = checked;

  const element = h(
    'label',
    { class: 'ps-checkbox', for: id },
    input,
    h('span', { class: 'ps-checkbox__label', text: label }),
  );

  if (onChange) {
    input.addEventListener('change', onChange);
  }

  return {
    element,
    input,
    getValue: () => input.checked,
    setValue: (next) => {
      input.checked = next;
    },
    focus: () => input.focus(),
  };
}

/**
 * CMP-15 — Select.
 * Usa el control nativo por accesibilidad y conserva la anatomía de FormField.
 */
export function createSelectField({
  id = nextFieldId(),
  name = '',
  label = '',
  value = '',
  options = [],
  placeholder = '',
  required = false,
  optional = false,
  requiredMark = false,
  help = '',
  onInput = null,
  onChange = null,
} = {}) {
  const messageId = `${id}-message`;
  const helpId = `${id}-help`;
  const describedBy = [help ? helpId : '', messageId].filter(Boolean).join(' ');

  const nodes = [];

  if (placeholder) {
    nodes.push(h('option', { value: '', text: placeholder }));
  }

  for (const option of options) {
    nodes.push(
      h('option', {
        value: option.value,
        text: option.label,
        disabled: option.disabled || null,
      }),
    );
  }

  const select = h(
    'select',
    {
      class: 'ps-field__input ps-field__select',
      id,
      name: name || null,
      required,
      attrs: { 'aria-describedby': describedBy },
    },
    ...nodes,
  );
  select.value = value;

  const messageElement = h('p', {
    class: 'ps-field__message',
    id: messageId,
    attrs: { role: 'alert' },
  });
  const helpElement = help ? h('p', { class: 'ps-field__help', id: helpId, text: help }) : null;

  const control = h(
    'div',
    { class: 'ps-field__control ps-field__control--with-chevron' },
    select,
    h(
      'span',
      { class: 'ps-field__chevron', 'aria-hidden': 'true' },
      createIcon('chevron-down', { size: 18 }),
    ),
  );

  const labelElement = label
    ? h(
        'label',
        { class: 'ps-field__label', for: id },
        label,
        requiredMark ? h('span', { class: 'ps-field__required', text: ' (obligatorio)' }) : null,
        optional ? h('span', { class: 'ps-field__optional', text: ' (opcional)' }) : null,
      )
    : null;

  const element = h(
    'div',
    { class: 'ps-field', id: `${id}-field` },
    labelElement,
    control,
    helpElement,
    messageElement,
  );

  function setError(message = '') {
    element.classList.add('is-invalid');
    select.setAttribute('aria-invalid', 'true');
    messageElement.textContent = message;
  }

  function clearError() {
    element.classList.remove('is-invalid');
    select.removeAttribute('aria-invalid');
    messageElement.textContent = '';
  }

  function setDisabled(next) {
    select.disabled = next;
    element.classList.toggle('is-disabled', next);
  }

  if (onInput) {
    select.addEventListener('input', onInput);
  }

  if (onChange) {
    select.addEventListener('change', onChange);
  }

  return {
    element,
    select,
    messageElement,
    setError,
    clearError,
    setValue: (next) => {
      select.value = next;
    },
    getValue: () => select.value,
    setDisabled,
    focus: () => select.focus(),
  };
}

/**
 * CMP-14 — Textarea con contador opcional.
 */
export function createTextareaField({
  id = nextFieldId(),
  name = '',
  label = '',
  value = '',
  placeholder = '',
  rows = 4,
  maxlength = 0,
  required = false,
  optional = false,
  requiredMark = false,
  help = '',
  onInput = null,
} = {}) {
  const messageId = `${id}-message`;
  const helpId = `${id}-help`;
  const counterId = `${id}-counter`;
  const describedBy = [help ? helpId : '', messageId, maxlength ? counterId : '']
    .filter(Boolean)
    .join(' ');

  const textarea = h('textarea', {
    class: 'ps-field__input ps-field__textarea',
    id,
    name: name || null,
    rows,
    placeholder: placeholder || null,
    maxlength: maxlength || null,
    required,
    attrs: { 'aria-describedby': describedBy },
  });
  textarea.value = value;

  const messageElement = h('p', {
    class: 'ps-field__message',
    id: messageId,
    attrs: { role: 'alert' },
  });
  const helpElement = help ? h('p', { class: 'ps-field__help', id: helpId, text: help }) : null;
  const counterElement = maxlength
    ? h('p', {
        class: 'ps-field__counter',
        id: counterId,
        text: `${textarea.value.length}/${maxlength}`,
      })
    : null;

  const labelElement = label
    ? h(
        'label',
        { class: 'ps-field__label', for: id },
        label,
        requiredMark ? h('span', { class: 'ps-field__required', text: ' (obligatorio)' }) : null,
        optional ? h('span', { class: 'ps-field__optional', text: ' (opcional)' }) : null,
      )
    : null;

  const element = h(
    'div',
    { class: 'ps-field', id: `${id}-field` },
    labelElement,
    h('div', { class: 'ps-field__control ps-field__control--textarea' }, textarea),
    counterElement,
    helpElement,
    messageElement,
  );

  function updateCounter() {
    if (counterElement) {
      counterElement.textContent = `${textarea.value.length}/${maxlength}`;
    }
  }

  function setError(message = '') {
    element.classList.add('is-invalid');
    textarea.setAttribute('aria-invalid', 'true');
    messageElement.textContent = message;
  }

  function clearError() {
    element.classList.remove('is-invalid');
    textarea.removeAttribute('aria-invalid');
    messageElement.textContent = '';
  }

  function setDisabled(next) {
    textarea.disabled = next;
    element.classList.toggle('is-disabled', next);
  }

  textarea.addEventListener('input', () => {
    updateCounter();

    if (onInput) {
      onInput();
    }
  });

  return {
    element,
    input: textarea,
    messageElement,
    setError,
    clearError,
    setValue: (next) => {
      textarea.value = next;
      updateCounter();
    },
    getValue: () => textarea.value,
    setDisabled,
    focus: () => textarea.focus(),
  };
}
