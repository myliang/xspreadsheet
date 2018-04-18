import { Element, h } from "./element";

export class Icon extends Element{

  constructor (name: string) {
    super();
    this.class('spreadsheet-icon').child(h().class(`spreadsheet-icon-img ${name}`).el);
  }

}

export function buildIcon (name: string) {
  return new Icon(name);
}