const _alphabet = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
export function alphabet(index: number): string {
  const [a, b] = [parseInt(index / _alphabet.length + ''), index % _alphabet.length]
  // console.log('a: ', a, '; b: ', b)
  return a > 0 ? `${_alphabet[a - 1]}${_alphabet[b]}` : _alphabet[b]
}
