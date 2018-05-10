const _alphabet = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
export function alphabet(index: number): string {
  const [a, b] = [parseInt(index / _alphabet.length + ''), index % _alphabet.length]
  // console.log('a: ', a, '; b: ', b)
  return a > 0 ? `${_alphabet[a - 1]}${_alphabet[b]}` : _alphabet[b]
}

export function alphabetIndex (key: string): number {
  let ret = 0;
  for (let i = 0; i < key.length; i++) {
    // console.log(key.charCodeAt(i), key[i])
    let cindex = key.charCodeAt(i) - 65;
    ret += i * _alphabet.length + cindex;
  }
  return ret;
}
