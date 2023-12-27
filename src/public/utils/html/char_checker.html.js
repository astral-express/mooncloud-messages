// Checks if string is within the range of letters and numbers in ascii table
export function checkIfItsAlphabeticalOrNumeralChar(str) {
  for (let i = 0; i < str.length; i++) {
    let char = str[i].charCodeAt(0);
    if (char >= 0 && char <= 32) {
      return null;
    }
    if (char >= 65 && char <= 90) {
      return true;
    }
    if ((char >= 48 && char <= 57) || (char >= 97 && char <= 122)) continue;
    else return false;
  }
}
