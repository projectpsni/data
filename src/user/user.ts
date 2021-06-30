import { IModel } from "../common";

export default class User implements IModel {
  readonly #id: string;
  #name: string|null;
  #email: string;
  #details?: object={};
  #roles: string[]=[];

  constructor(data:{id:string, email:string, name?:string, details?:object, roles?:string[]}){
    this.#id = data.id;
    this.email = data.email,
    this.#name = data.name||null;
    this.details = data.details||{};
    this.#roles = data.roles||[];
  }

  get id():string {
    return this.#id;
  }

  get name():string|null {
    return this.#name
  }
  
  set name(name:string|null) {
    this.#name=name;
  }

  get email():string {
    return this.#email;
  }
  set email(email:string) {
    this.#email = email.toLocaleLowerCase();
  }

  get details():object {
    return this.#details;
  }
  set details(details:object) {
    this.#details = details||{};
  }

  get roles():ReadonlyArray<string> {
    return this.#roles;
  }


  toJSON():object {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      details: this.details,
      roles: this.roles
    }
  }

  toString():string {
    return `${this.id}:${this.email}`;
  }
}