/**
 * Helpers mínimos para construir DOM sin plantillas HTML.
 *
 * Regla de seguridad: los datos de usuario siempre entran como texto. No se
 * expone una opción `html` en h(); el único HTML confiable del proyecto son los
 * SVG estáticos de lucide-static, que se parsean en icon.js.
 */

export function appendChildren(element, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) {
      continue;
    }

    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

function applyAttribute(element, name, value) {
  if (value === null || value === undefined || value === false) {
    return;
  }

  if (value === true) {
    element.setAttribute(name, '');
    return;
  }

  element.setAttribute(name, String(value));
}

export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) {
      continue;
    }

    if (key === 'class' || key === 'className') {
      element.className = value;
      continue;
    }

    if (key === 'text') {
      element.textContent = value;
      continue;
    }

    if (key === 'dataset') {
      Object.assign(element.dataset, value);
      continue;
    }

    if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
      continue;
    }

    if (key === 'attrs' && typeof value === 'object') {
      for (const [attribute, attributeValue] of Object.entries(value)) {
        applyAttribute(element, attribute, attributeValue);
      }
      continue;
    }

    if (key === 'on' && typeof value === 'object') {
      for (const [eventName, handler] of Object.entries(value)) {
        if (typeof handler === 'function') {
          element.addEventListener(eventName, handler);
        }
      }
      continue;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
      continue;
    }

    applyAttribute(element, key, value);
  }

  appendChildren(element, children);
  return element;
}

export function fragment(...children) {
  const node = document.createDocumentFragment();
  appendChildren(node, children);
  return node;
}

export function clear(element) {
  element.replaceChildren();
  return element;
}

export function mount(parent, child) {
  clear(parent);
  parent.append(child);
  return child;
}

export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function setAttrs(element, attributes) {
  for (const [name, value] of Object.entries(attributes)) {
    applyAttribute(element, name, value);
  }

  return element;
}

export function toggleClass(element, className, force) {
  element.classList.toggle(className, force);
  return element;
}
