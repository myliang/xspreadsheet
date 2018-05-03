export interface Cell {
  font?: string;
  format?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  align?: string;
  valign?: string;
  wordWrap?: boolean;
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
  bold: false,
  italic: false,
  underline: false,
  color: '#333',
  backgroundColor: '#fff',
  align: 'left',
  valign: 'middle',
  wordWrap: false,
  invisible: false,
  rowspan: 1,
  colspan: 1,
  text: '',

}

export function getStyleFromCell (cell: Cell | null): {[key: string]: string} {
  const map: {[key: string]: string} = {}
  if (cell) {
    if (cell.font) map['font-family'] = cell.font
    if (cell.fontSize) map['font-size'] = `${cell.fontSize}px`
    if (cell.bold) map['font-weight'] = 'bold'
    if (cell.italic) map['font-style'] = 'italic'
    if (cell.underline) map['text-decoration'] = 'underline'
    if (cell.color) map['color'] = cell.color
    if (cell.backgroundColor) map['background-color'] = cell.backgroundColor
    if (cell.align) map['text-align'] = cell.align
    if (cell.valign) map['vertical-align'] = cell.valign
    if (cell.invisible) {
      map['display'] = 'none'
    }
    if (cell.wordWrap) {
      map['word-wrap'] = 'break-word'
      map['white-space'] = 'normal'
    }
  }
  return map
}
