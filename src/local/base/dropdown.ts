import { Element, h } from "./element";
import { buildIcon } from "./icon";

export class Dropdown extends Element {
  content: Element;

  constructor (title: string | Element, width: string, contentChildren: Element[]) {
    super();
    this.class('spreadsheet-dropdown spreadsheet-item');

    this.content = h().class('spreadsheet-dropdown-content')
      .children(contentChildren)
      .on('click', (evt) => this.toggleHandler(evt))
      .style('width', width).hide();

    this.child(h().class('spreadsheet-dropdown-header').children([
      typeof title === 'string' ? h().class('spreadsheet-dropdown-title').child(title) : title,
      h().class('spreadsheet-dropdown-icon').on('click', (evt) => this.toggleHandler(evt)).child(buildIcon('arrow-down'))
    ])).child(this.content);
  }

  documentHandler (e: any) {
    return () => {
      if (this.content.el.contains(e.target)) {
        return false
      }
      this.content.hide()
      document.removeEventListener('click', this.documentHandler)
    }
  }

  toggleHandler (evt: Event) {
    // evt.stopPropagation()
    if (this.content.isHide()){
      this.content.show()
      document.addEventListener('click', this.documentHandler)
    } else {
      this.content.hide()
      document.removeEventListener('click', this.documentHandler)
    }
  }
}
export function buildDropdown(title: string | Element, width: string, contentChildren: Element[]) {
  return new Dropdown(title, width, contentChildren)
}