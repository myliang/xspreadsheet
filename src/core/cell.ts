export interface Cell {
  font?: string;
  format?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  backgroundColor?: string;
  align?: string;
  valign?: string;
  wordWrap?: string;
  visable?: boolean;
  rowspan?: number;
  colspan?: number;
  text?: string;
  merge?: [number, number];
  [key: string]: any
}

export const defaultCell: Cell = {
  font: 'Microsoft YaHei',
  format: 'normal',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#333',
  backgroundColor: '#fff',
  align: 'left',
  valign: 'middle',
  wordWrap: 'normal',
  visable: true,
  rowspan: 1,
  colspan: 1,
  text: '',

  // style () {
  //   const map: {[key: string]: string} = {}
  //   if (this.font) map['font-family'] = this.font
  //   if (this.fontSize) map['font-size'] = `${this.fontSize}px`
  //   if (this.fontWeight) map['font-weight'] = this.fontWeight
  //   if (this.fontStyle) map['font-style'] = this.fontStyle
  //   if (this.textDecoration) map['text-decoration'] = this.textDecoration
  //   if (this.color) map['color'] = this.color
  //   if (this.backgroundColor) map['background-color'] = this.backgroundColor
  //   if (this.align) map['text-align'] = this.align
  //   if (this.valign) map['vertical-align'] = this.valign
  //   if (this.visable) {
  //     map['display'] = 'none'
  //   }
  //   if (this.wordWrap) {
  //     map['word-wrap'] = this.wordWrap
  //     map['white-space'] = 'normal'
  //   }
  //   return map
  // }
}
