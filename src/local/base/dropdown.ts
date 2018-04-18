import { Element, h } from "./element";
import { buildIcon } from "./icon";

export class Dropdown extends Element {
  content: Element;

  constructor (title: string | HTMLElement, width: string, contentChildren: HTMLElement[]) {
    super();
    this.class('spreadsheet-dropdown spreadsheet-item');

    this.content = h().class('spreadsheet-dropdown-content')
      .children(contentChildren)
      .on('click', this.toggleHandler)
      .style('width', width).hide();

    this.child(h().class('spreadsheet-dropdown-header').children([
      typeof title === 'string' ? h().class('spreadsheet-dropdown-title').child(title) : title,
      h().class('spreadsheet-dropdown-icon').on('click', this.toggleHandler).child(buildIcon('arrow-down'))
    ])).child(this.content);
  }

  documentHandler (e: any) {
    if (this.el.contains(e.target)) {
      return false
    }
    this.content.hide()
    document.removeEventListener('click', this.documentHandler)
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
export function buildDropdown(title: string | HTMLElement, width: string, contentChildren: HTMLElement[]) {
  return new Dropdown(title, width, contentChildren)
}