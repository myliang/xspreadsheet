# Spreadsheet

[![npm package](https://img.shields.io/npm/v/spreadsheet.svg)](https://www.npmjs.org/package/spreadsheet)
[![NPM downloads](http://img.shields.io/npm/dm/spreadsheet.svg)](https://npmjs.org/package/spreadsheet)

> a javascript spreadsheet for web

## Install
```shell
npm install typescript --save-dev
npm install awesome-typescript-loader --save-dev
npm install xspreadsheet --save-dev
npm install @types/xspreadsheet --save-dev
```

## Quick Start

``` javascript
import xspreadsheet from 'xspreadsheet'

const x = xspreadsheet(document.getElementById('#id'))
x.change = (data) => {
  console.log('data:', data)
}

// edit
// data is param in the change method
xspreadsheet(document.getElementById('#id'), {d: data})
```

### in tsconfig.json
```
{
  "compilerOptions": {
    ....
    "types": ["xspreadsheet"],
    ....
  }
}

```
### images

<p align="center">
  <a href="https://github.com/myliang/xspreadsheet">
    <img width="250" src="/docs/demo.png?raw=true">
  </a>
</p>

## Browser Support
Modern browsers and Internet Explorer 9+(no test).

## LICENSE
MIT
