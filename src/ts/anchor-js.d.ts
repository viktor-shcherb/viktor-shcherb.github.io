declare module 'anchor-js' {
  export interface AnchorJSOptions {
    placement?: 'left' | 'right';
    visible?: 'always' | 'hover' | 'touch';
    icon?: string;
    class?: string;
    base?: string;
    titleText?: string;
    truncate?: number;
  }

  export default class AnchorJS {
    options: AnchorJSOptions;
    elements: Element[];
    constructor(options?: AnchorJSOptions);
    add(selector?: string | Element, scope?: ParentNode): this;
    remove(selector?: string | Element, scope?: ParentNode): this;
    removeAll(): this;
    hasAnchorJSLink(element: Element): boolean;
  }
}
