import IUserRepository from "./user_repository";
import { Pool } from 'pg';
import User from "./user";

export default class PG_User_Repository implements IUserRepository {

  private _pool:Pool;

  constructor(connectionStringOrPool:string|Pool ) {
    if (typeof connectionStringOrPool === 'string') {
      this._pool = new Pool({
        connectionString: connectionStringOrPool,
      });
    } else {
      this._pool = connectionStringOrPool;
    }
  }
  async create(email: string): Promise<User> {
    const res = await this._pool.query('INSERT INTO users(email) VALUES($1) RETURNING *', [email.toLocaleLowerCase()]);
    return new User({id: res.rows[0].id, 
      email: res.rows[0].email,
    });
  }

  async update(user: User): Promise<User|null> {
    try {
      const res = await this._pool.query('UPDATE users SET email=$1, name=$2, details=$3 WHERE id=$4 RETURNING *', 
        [user.email.toLocaleLowerCase(), user.name, user.details, user.id]);
      if (res.rowCount===0) return null;
      const data = res.rows[0];
      user.name = data.name;
      user.email = data.email;
      user.details = data.details || {};
      return user;
    } catch (ex) {
      console.error('error in update', ex);
      return null;
    }
  }

  async findById(id: string): Promise<User|null> {
    try {
      const res = await this._pool.query('SELECT id, name, email, details from users WHERE id=$1',[id]);
      if (res.rowCount <=0) return null;
      const data = res.rows[0];
      return new User(data);
    } catch (ex) {
      // console.error(`error in findById(${id})`, ex);
    }
    return null;
  }

  async findByEmail(emailpart: string): Promise<readonly User[]> {
    const res = await this._pool.query('SELECT id, name, email from users WHERE lower(email) LIKE $1',[`%${emailpart.toLocaleLowerCase()}%`]);
    const users:Array<User> = res.rows.map(data=>new User(data));
    return users;

  }

  async findByName(namepart: string): Promise<readonly User[]> {
    const res = await this._pool.query('SELECT id, name, email from users WHERE lower(name) LIKE $1',[`%${namepart.toLocaleLowerCase()}%`]);
    const users:Array<User> = res.rows.map(data=>new User(data));
    return users;
  }
  
}