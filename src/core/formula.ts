export interface Formula {
  key: string;
  title: string;
  render(ary: Array<number>): number
}

export const formulas: Array<Formula> = [
  {key: 'SUM', title: '求和', render: (vv) => vv.reduce((a, b) => a + b, 0)},
  {key: 'AVERAGE', title: '平均值', render: (vv) => vv.reduce((a, b) => a + b, 0) / vv.length},
  {key: 'MAX', title: '最大值', render: (vv) => Math.max(...vv)},
  {key: 'MIN', title: '最小值', render: (vv) => Math.min(...vv)}
]