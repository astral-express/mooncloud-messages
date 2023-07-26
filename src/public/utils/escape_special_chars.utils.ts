// Throws a warning to user if input has a special character that's not a letter or a number
export function checkIfItsAlphabeticalOrNumeralChar(str: string) {
  for (let i = 0; i < str.length; i++) {
    let char: number = str[i].charCodeAt(0);
    if (
      (char >= 48 && char <= 57) ||
      (char >= 65 && char <= 90) ||
      (char >= 97 && char <= 122)
    )
      continue;
    else return false;
  }
}
