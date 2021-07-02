import IRoleRepository from "../src/role/role_repository";
import PG_Role_Repository from "../src/role/pg_role_repository";
import {v4 as uuid} from 'uuid';
import getPool from './pool';
import User from "../src/user/user";
import Role from "../src/role/role";
let cacheManager = require('cache-manager');

const MOCKDB=!(process.env.TESTDB);
const dbPool = getPool();
describe("pg_role_repository", () => {
  const TABLENAME="roles";

  const testObjs= async (data:{name:string, description?:string, display_name?:string})=>{
    let context = new User({id:uuid(), email:`${uuid()}@roletests.com`});
    let role = new Role({id:uuid(), display_name: data.display_name, name: data.name, description: data.description});
    const cache = cacheManager.caching({store: 'memory', ttl: 10/*seconds*/});
    let somerole:any = role.toJSON();
    let pool = dbPool;
    if (!MOCKDB) {
      await dbPool.query(`DELETE FROM roles WHERE name = $1`,[data.name.toLocaleLowerCase()])
      const res=await dbPool.query('INSERT INTO roles(name, display_name, description) VALUES($1, $2, $3) RETURNING id, display_name, name, description', 
      [somerole.name, somerole.display_name, somerole.description]);
      somerole=res.rows[0];
      role=new Role(somerole);
    } else {
      pool = getPool();
    }
    let repo = new PG_Role_Repository(pool, {cache});
    let repowithcontext= new PG_Role_Repository(pool, {context});
    return {somerole, context, pool, cache, repo, repowithcontext};
  }

  beforeAll(async()=>{
    if (!MOCKDB) {
      await dbPool.query(`DELETE FROM ${TABLENAME}`);
    }

  });

  afterAll(async () => {
    if (!MOCKDB) {
      await dbPool.query(`DELETE FROM ${TABLENAME}`);
      await dbPool.end();
    }
    jest.clearAllMocks();
  });


  describe("create",()=>{
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query(`DELETE FROM ${TABLENAME} WHERE lower(name)='create.test'`);
      }
    });

    afterAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query(`DELETE FROM ${TABLENAME} WHERE lower(name)='create.test'`);
      }
    });

    test("create role", async () => {
      const name = 'User.Read';
      const {pool, repo} = await testObjs({name:`${name}`});
      const somerole = {id:uuid(), name};
      if (MOCKDB) {
        pool.query.mockResolvedValueOnce({ rows: [somerole], rowCount: 1 });
      }

      const role = await repo.create(name)

      expect(role.name).toBe(name);
      expect(role.display_name).toBeNull();
      expect(role.description).toBeNull();
      expect(role.id).toBeTruthy();
    });
  })

  describe('findById',()=>{
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query('DELETE FROM roles WHERE lower(name) LIKE $1', ['findbyid.role%']);
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query('DELETE FROM roles WHERE lower(name) LIKE $1', ['findbyid.role%']);
      }
    })
    test("find by id returns matching role object", async () => {
      const name = `FindById.Role.${uuid()}`;
      const {somerole, pool, repo} = await testObjs({name:`${name}`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [somerole], rowCount: 1 });
      const role = await repo.findById(somerole.id);
      expect(role.name).toBe(somerole.name);
      expect(role.id).toBe(somerole.id);
    });
    test("find by id returns null when no matches", async () => {
      const name = `FindById.Role.${uuid()}`;
      const {pool, repo} = await testObjs({name});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const role = await repo.findById('invalidid');
      expect(role).toBeNull()
    });
  })

  describe('findByName',()=>{
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query('DELETE FROM roles WHERE lower(name) LIKE $1', ['findbyname.role%']);
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query('DELETE FROM roles WHERE lower(name) LIKE $1', ['findbyname.role%']);
      }
    })

    test("find by name", async () => {
      const name = `FindByName.Role.${uuid()}`;
      const {somerole, pool, repo} = await testObjs({name:`${name}`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [somerole]});
      const roles = await repo.findByName(somerole.name.substr(4));
      expect(roles.length).toBe(1);
      expect(roles[0].name).toBe(somerole.name);
      expect(roles[0].id).toBe(somerole.id);
    });
    test("find by name should be caseinsensitive", async () => {
      const name = `FindByName.Role.${uuid()}`;
      const {somerole, pool, repo} = await testObjs({name:`${name}`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [somerole]});
      const roles = await repo.findByName(somerole.name.substr(4).toUpperCase());
      expect(roles.length).toBe(1);
      expect(roles[0].name).toBe(somerole.name);
      expect(roles[0].id).toBe(somerole.id);
    });
    test("find by name returns empty array when no matches", async () => {
      const name = `FindByName.Role.${uuid()}`;
      const {pool, repo} = await testObjs({name:`${name}`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const roles = await repo.findByName('nonexistent');
      expect(roles.length).toBe(0);
    });
  })

})