import { Element, h } from "./element";

export class Icon extends Element{

  img: Element;

  constructor (name: string) {
    super();
    this.class('spreadsheet-icon').child(this.img = h().class(`spreadsheet-icon-img ${name}`));
  }

  replace (name: string) {
    this.img.class(`spreadsheet-icon-img ${name}`)
  }

}

export function buildIcon (name: string) {
  return new Icon(name);
}