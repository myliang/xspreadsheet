import { Element } from "./element";

export class Menu extends Element{

  constructor (align = 'vertical') {
    super();
    this.class(`spreadsheet-menu ${align}`)
  }

}

export function buildMenu (align = 'vertical') {
  return new Menu(align);
}