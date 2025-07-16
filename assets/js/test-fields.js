export const TYPE_KEYS  = ['int', 'float', 'str', 'bool'];
export const TYPE_LABEL = {
  int: 'Integer',
  float: 'Float',
  str: 'String',
  bool: 'Boolean',
};

export const TYPE_DEFS = {
  int: {
    label: 'Integer',
    makeInput: ({ id, idx }) => `
      <div class="input-wrapper">
        <input id="${id}" class="test-arg-input" data-idx="${idx}" type="number" step="1" placeholder="0">
        <div class="stepper">
          <button type="button" class="step up" aria-label="increment">+</button>
          <button type="button" class="step down" aria-label="decrement">−</button>
        </div>
      </div>`,
  },
  float: {
    label: 'Float',
    makeInput: ({ id, idx }) => `
      <div class="input-wrapper-float">
        <input id="${id}" class="test-arg-input" data-idx="${idx}" type="number" step="any" placeholder="0.0">
      </div>`,
  },
  str: {
    label: 'String',
    makeInput: ({ id, idx }) => `
      <input id="${id}" class="test-arg-input" data-idx="${idx}" type="text" placeholder="text">`,
  },
  bool: {
    label: 'Boolean',
    makeInput: ({ id, idx }) => `
      <button id="${id}" class="test-arg-input bool-toggle bool-field" data-idx="${idx}" data-value="false" type="button">false</button>`
  },
};

export function typeToClass(type){
  switch(type){
    case 'bool':  return 'bool-field';
    case 'int':
    case 'float': return 'number-field';
    case 'str':   return 'string-field';
    default:      return '';
  }
}

export function buildTestField({ tId, argIdx, argName, argType }){
  const typeClass = typeToClass(argType);
  if(!argType){
    return `
      <div class="test-field ${typeClass}">
        <label for="${tId}-${argIdx}">${argName}</label>
        <input class="test-arg-input" data-idx="${argIdx}" id="${tId}-${argIdx}" disabled placeholder="Select type first...">
      </div>`;
  }
  const inputHTML = (TYPE_DEFS[argType] ?? TYPE_DEFS.str)
                      .makeInput({ id:`${tId}-${argIdx}`, idx:argIdx });
  return `
    <div class="test-field ${typeClass}">
      <label for="${tId}-${argIdx}">${argName}</label>
      ${inputHTML}
    </div>`;
}

export function buildReturnField(tId, type){
  const typeClass = typeToClass(type);
  if(!type){
    return `
      <div class="test-field return-field ${typeClass}">
        <label for="${tId}-return">return</label>
        <input class="test-arg-input" data-idx="return" disabled placeholder="Select type first...">
      </div>`;
  }
  const inner = (TYPE_DEFS[type] ?? TYPE_DEFS.str)
                  .makeInput({ id:`${tId}-return`, idx:'return' });
  return `
    <div class="test-field return-field ${typeClass}">
      <label for="${tId}-return">return</label>
      ${inner}
    </div>`;
}

export function buildStdInField(tId){
  return `
    <div class="test-field full-row io-field stdin-field">
      <label for="${tId}-stdin">stdin</label>
      <textarea id="${tId}-stdin" class="auto-grow" rows="1" placeholder="Input sent to stdin"></textarea>
    </div>`;
}

export function buildStdOutField(tId){
  return `
    <div class="test-field full-row io-field stdout-field">
      <label for="${tId}-stdout">stdout</label>
      <textarea id="${tId}-stdout" class="auto-grow" rows="1" placeholder="Expected stdout"></textarea>
    </div>`;
}

export function defaultFor(type){
  switch(type){
    case 'int':   return 0;
    case 'float': return 0.0;
    case 'str':   return '';
    case 'bool':  return false;
    default:      return null;
  }
}

export function readValue(el, type){
  if(type === 'bool') return el.dataset.value === 'true';
  if(type === 'int')   return el.value === '' ? 0 : parseInt(el.value,10);
  if(type === 'float') return el.value === '' ? 0.0 : parseFloat(el.value);
  if(type === 'str')   return el.value === '' ? '' : el.value;
  return el.value;
}

export const html = (strings, ...vals) =>
  Object.assign(document.createElement('template'), {
    innerHTML: String.raw(strings, ...vals).trim(),
  }).content.firstElementChild;

export const uuid = () => crypto.randomUUID();
