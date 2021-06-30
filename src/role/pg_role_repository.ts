import IRoleRepository from "./role_repository";
import { Pool } from 'pg';
import Role from "./role";

export default class PG_Role_Repository implements IRoleRepository {

  #pool:Pool;

  constructor(connectionStringOrPool:string|Pool ) {
    if (typeof connectionStringOrPool === 'string') {
      this.#pool = new Pool({
        connectionString: connectionStringOrPool,
      });
    } else {
      this.#pool = connectionStringOrPool;
    }
  }
  async create(name: string): Promise<Role> {
    const res = await this.#pool.query('INSERT INTO roles(name) VALUES($1) RETURNING id, name', [name]);
    return new Role(res.rows[0]);
  }

  async update(role: Role): Promise<Role> {
    throw new Error("Method not implemented.");
  }
 
  async findById(id: string): Promise<Role> {
    try {
      const res = await this.#pool.query('SELECT id, name, display_name, description from roles WHERE id=$1',[id]);
      if (res.rowCount <=0) return null;
      const data = res.rows[0];
      return new Role(data);
    } catch (ex) {
      // console.error(`error in findById(${id})`, ex);
    }
    return null;
  }

  async findByName(namepart: string): Promise<readonly Role[]> {
    const res = await this.#pool.query('SELECT id, name, display_name, description from roles WHERE lower(name) LIKE $1',[`%${namepart.toLocaleLowerCase()}%`]);
    const roles:Array<Role> = res.rows.map(data=>new Role(data));
    return roles;
  }
}