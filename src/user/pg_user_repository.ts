import IUserRepository from "./user_repository";
import { Pool } from 'pg';
import User from "./user";
import { ICache } from "../common";

export default class PG_User_Repository implements IUserRepository {

  readonly #pool:Pool;
  readonly #cache?:ICache;
  readonly #context:any;

  constructor(connectionStringOrPool:string|Pool , options?:{cache?:ICache, context?:any}) {
    if (typeof connectionStringOrPool === 'string') {
      this.#pool = new Pool({
        connectionString: connectionStringOrPool,
      });
    } else {
      this.#pool = connectionStringOrPool;
    }
    if (options) {
      this.#cache = options.cache;
      this.#context = options.context;
    }
  }
  async create(email: string): Promise<User> {
    const res = await this.#pool.query('INSERT INTO users(email) VALUES($1) RETURNING id, email', [email.toLocaleLowerCase()]);
    const data = res.rows[0];
    return new User(data);
  }

  async update(user: User): Promise<User|null> {
    try {
      if (this.#context?.id!==user.id) {
        // console.debug(`Unauthorized context (${this.#context?.id}!==${user.id})`);
        // TODO: does the the context have the right roles?
        return null;
      }
      const res = await this.#pool.query('UPDATE users SET email=$1, name=$2, picture=$3 WHERE id=$4 RETURNING id, email, name, picture', 
        [user.email, user.name, user.picture, user.id]);
      if (res.rowCount===0) return null;
      const data = res.rows[0];
      user.name = data.name;
      user.email = data.email;
      user.picture = data.picture;
      return user;
    } catch (ex) {
      console.error('error in update', ex);
      return null;
    }
  }

  async findById(id: string): Promise<User|null> {
    try {
      if (this.#cache) {
        const userdata = await this.#cache.get(`user.${id}`);
        if (userdata) {
          return new User(userdata);
        }
      }

      const res = await this.#pool.query(`SELECT id, name, email, picture from users WHERE id=$1`, [id]);
      if (res.rowCount <=0) return null;
      const data = res.rows[0];
      const usr = new User(data);
      if (this.#cache) {
        this.#cache.set(`user.${usr.id}`, data)
      }
      return usr;
    } catch (ex) {
      // console.error(`error in findById(${id})`, ex);
    }
    return null;
  }

  async findByEmail(emailpart: string): Promise<readonly User[]> {
    const res = await this.#pool.query('SELECT id, name, email, picture from users WHERE lower(email) LIKE $1', [`%${emailpart.toLocaleLowerCase()}%`]);
    const users:Array<User> = res.rows.map(data=>new User(data));
    return users;
  }

  async findByName(namepart: string): Promise<readonly User[]> {
    const res = await this.#pool.query('SELECT id, name, email, picture from users WHERE lower(name) LIKE $1', [`%${namepart.toLocaleLowerCase()}%`]);
    const users:Array<User> = res.rows.map(data=>new User(data));
    return users;
  }
}