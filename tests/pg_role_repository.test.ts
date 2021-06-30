import IRoleRepository from "../src/role/role_repository";
import PG_Role_Repository from "../src/role/pg_role_repository";
import getPool from './pool';

const MOCKDB=!(process.env.TESTDB);

describe("pg_role_repository", () => {
  let repo:IRoleRepository;
  let pool:any;
  const TABLENAME="roles";

  beforeAll(async()=>{
    if (repo) return;
    pool=getPool();
    repo = new PG_Role_Repository(pool);
  });

  afterAll(async () => {
    if (!MOCKDB) {
      await pool.query(`DELETE FROM ${TABLENAME}`);
      await pool.end();
    }
    jest.clearAllMocks();
  });


  describe("create",()=>{
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await pool.query(`DELETE FROM ${TABLENAME} WHERE lower(name)='user.read'`);
      }
    });

    afterAll(async ()=>{
      if (!MOCKDB) {
        await pool.query(`DELETE FROM ${TABLENAME} WHERE lower(name)='user.read'`);
      }
    });

    test("create role", async () => {
      const name = 'User.Read';
      if (MOCKDB) {
        pool.query.mockResolvedValueOnce({ rows: [{id:'1', name}], rowCount: 1 });
      }

      const role = await repo.create(name)

      expect(role.name).toBe(name);
      expect(role.display_name).toBeNull();
      expect(role.description).toBeNull();
      expect(role.id).toBeTruthy();
    });
  })

  describe('findById',()=>{
    let somerole:any={id:'1', name:'User.Read'};
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM roles WHERE lower(name)=$1', [somerole.name])
        const res=await pool.query('INSERT INTO roles(name) VALUES($1) RETURNING *', [somerole.name]);
        somerole=res.rows[0];
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM roles WHERE id=$1', [somerole.id])
      }
    })
    test("find by id returns matching role object", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [somerole], rowCount: 1 });
      const role = await repo.findById(somerole.id);
      expect(role.name).toBe(somerole.name);
      expect(role.id).toBe(somerole.id);
    });
    test("find by id returns null when no matches", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const role = await repo.findById('invalidid');
      expect(role).toBeNull()
    });
  })

  describe('findByName',()=>{
    let somerole:any={id:'1', name: 'User.All'};
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM roles WHERE lower(name)=$1', [somerole.name]);
        const res=await pool.query('INSERT INTO roles(name) VALUES($1) RETURNING *', [somerole.name]);
        somerole=res.rows[0];
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM roles WHERE id=$1', [somerole.id])
      }
    })
    test("find by name", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [somerole]});
      const roles = await repo.findByName(somerole.name.substr(0,4));
      expect(roles.length).toBe(1);
      expect(roles[0].name).toBe(somerole.name);
      expect(roles[0].id).toBe(somerole.id);
    });
    test("find by name should be caseinsensitive", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [somerole]});
      const roles = await repo.findByName(somerole.name.substr(2,5).toUpperCase());
      expect(roles.length).toBe(1);
      expect(roles[0].name).toBe(somerole.name);
      expect(roles[0].id).toBe(somerole.id);
    });
    test("find by name returns empty array when no matches", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const roles = await repo.findByName('nonexistent');
      expect(roles.length).toBe(0);
    });
  })

})