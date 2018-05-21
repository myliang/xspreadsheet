import { Element, h } from "./element";
import { buildIcon } from "./icon";

export class Dropdown extends Element {
  content: Element;
  title: Element;

  constructor (title: string | Element, width: string, contentChildren: Element[]) {
    super();
    this.class('spreadsheet-dropdown spreadsheet-item');

    this.content = h().class('spreadsheet-dropdown-content')
      .children(contentChildren)
      .onClickOutside(() => this.deactive())
      .on('click', (evt) => this.toggleHandler(evt))
      .style('width', width).hide();

    this.child(h().class('spreadsheet-dropdown-header').children([
      this.title = typeof title === 'string' ? h().class('spreadsheet-dropdown-title').child(title) : title,
      h().class('spreadsheet-dropdown-icon').on('click', (evt) => this.toggleHandler(evt)).child(buildIcon('arrow-down'))
    ])).child(this.content);
  }

  toggleHandler (evt: Event) {
    if (this.content.isHide()){
      this.content.show()
      this.active()
    } else {
      this.content.hide()
      this.deactive()
    }
  }
}
export function buildDropdown(title: string | Element, width: string, contentChildren: Element[]) {
  return new Dropdown(title, width, contentChildren)
}