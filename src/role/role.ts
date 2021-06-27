export default class Role {
  readonly id: string;
  name: string;
  private _display_name: string|null;
  private _description: string|null;

  constructor (data:{id: string, name:string, display_name?:string, description?:string}) {
    this.id = data.id;
    this.name = data.name;
    this.display_name = data.display_name||null;
    this.description = data.description||null;
  }

  get display_name():string|null {
    return this._display_name;
  }

  set display_name(display_name:string|null) {
    this._display_name = display_name;
  }

  get description():string|null {
    return this._description;
  }

  set description(description:string|null) {
    this._description = description;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      display_name: this.display_name,
      description: this.description,
    }
  }
}