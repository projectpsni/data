import { IModel } from "../common";

export default class Role implements IModel {
  readonly #id: string;
  readonly #name: string;
  #display_name: string|null;
  #description: string|null;

  constructor (data:{id: string, name:string, display_name?:string, description?:string}) {
    this.#id = data.id;
    this.#name = data.name;
    this.#display_name = data.display_name||null;
    this.#description = data.description||null;
  }

  get id():string {
    return this.#id;
  }

  get name():string {
    return this.#name;
  }

  get display_name():string|null {
    return this.#display_name;
  }

  set display_name(display_name:string|null) {
    this.#display_name = display_name;
  }

  get description():string|null {
    return this.#description;
  }

  set description(description:string|null) {
    this.#description = description;
  }

  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      display_name: this.display_name,
      description: this.description,
    }
  }

  toString():string {
    return `${this.id}:${this.name}`;
  }
}