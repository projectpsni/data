


export default class User {
  readonly id: string;
  name: string|null;
  private _email: string;
  private _details?: any={};
  private _roles: string[]=[];

  constructor(data:{id:string, email:string, name?:string, details?:object}){
    this.id = data.id;
    this.email = data.email,
    this.name = data.name||null;
    this.details = data.details;
  }

  get email():string {
    return this._email;
  }
  set email(email:string) {
    this._email = email.toLocaleLowerCase();
  }

  get details():any {
    return this._details;
  }
  set details(details:any) {
    this._details = details||{};
  }

  get roles():ReadonlyArray<string> {
    return this._roles;
  }


  toJSON(): object {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      details: this.details,
      roles: this._roles
    }
  }

  toString():string {
    return `${this.id}:${this.email}`;
  }
}