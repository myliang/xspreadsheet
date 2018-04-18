export interface Format {
  key: string;
  title: string;
  label?: string;
  render(txt: string): string;
}

const formatNumberRender = (v: string) => {
  if (/^(-?\d*.?\d*)$/.test(v)) {
    v = Number(v).toFixed(2).toString()
    const parts = v.split('.')
    parts[0] = parts[0].toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + ',')
    return parts.join('.')
  }
  return v
}

const formatRender = (v: string) => v

export const formats: Array<Format> = [
  {key: 'normal', title: 'Normal', render: formatRender},
  {key: 'text', title: 'Text', render: formatRender},
  {key: 'number', title: 'Number', label: '1,000.12', render: formatNumberRender},
  {key: 'percent', title: 'Percent', label: '10.12%', render: (v) => `${formatNumberRender(v)}%`},
  {key: 'RMB', title: 'RMB', label: '￥10.00', render: (v) => `￥${formatNumberRender(v)}`},
  {key: 'USD', title: 'USD', label: '$10.00', render: (v) => `$${formatNumberRender(v)}`}
]