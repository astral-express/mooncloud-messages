import * as bcryipt from "bcrypt";

export namespace Bcrypt {
  export function hashedPassword(pwd: any) {
    const saltRounds = 10;
    const salt = bcryipt.genSaltSync(saltRounds);
    return bcryipt.hashSync(pwd, salt);
  }

  export function comparePasswords(pwd: any, pwdDB: any) {
    return bcryipt.compareSync(pwd, pwdDB);
  }
}
