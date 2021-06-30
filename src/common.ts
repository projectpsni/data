

export interface IModel {
  toJSON(): object;
  toString(): string;
}

export interface ICache {
  get(key:string): Promise<any>;
  set(key:string, value:any, options?:any): Promise<any>;
  del(key:string): Promise<any>;
}