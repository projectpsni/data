import IUserRepository from "../src/user/user_repository";
import PG_User_Repository from "../src/user/pg_user_repository";
import {Pool} from 'pg';

const MOCK=0;

// jest.mock('pg', () => {
//   const mPool = {
//     connect: jest.fn(),
//     query: jest.fn(),
//     on: jest.fn(),
//   };
//   return { Pool: jest.fn(() => mPool) };
// });

describe("pg_user_repository", () => {
  let repo:IUserRepository;
  let pool:any;
  const TABLENAME="users";
 
  beforeAll(async()=>{
    if (repo) return;
    let connectionString = 'postgresql://postgres@localhost:5432/psitest';
    if (!MOCK) {
      connectionString = process.env.PSICONNSTR||'postgresql://postgres@localhost:5432/psitest';
      console.info(`connecting to ${connectionString}`);
    } 

    pool = new Pool({connectionString});
    
    repo = new PG_User_Repository(connectionString);

  });

  afterAll(async () => {
    if (!MOCK) {
      await pool.query(`DELETE FROM ${TABLENAME}`);
      await pool.end();
    }
    jest.clearAllMocks();
  });


  describe("create",()=>{
    beforeAll(async ()=>{
      if (!MOCK) {
        await pool.query("DELETE FROM users WHERE email='someone@example.com'");
      }
    });

    afterAll(async ()=>{
      if (!MOCK) {
        await pool.query("DELETE FROM users WHERE email='someone@example.com'");
      }
    });

    test("create user", async () => {
      const email = 'SomeOne@example.com';
      if (MOCK) {
        pool.query.mockResolvedValueOnce({ rows: [{id:'1', email:email.toLocaleLowerCase(), name: null}], rowCount: 1 });
      }
      const usr = await repo.create(email)
      
      expect(usr.email).toBe(email.toLocaleLowerCase());
      expect(usr.name).toBeNull();
      expect(usr.details).toBeTruthy();
      expect(usr.id).toBeTruthy();
    });
  })

 
  describe('findByEmail',()=>{
    let someone:any={id:'1', email:'someone@example.com', name: null};
    beforeAll(async ()=>{
      if (!MOCK) {
        await pool.query('DELETE FROM users WHERE email=$1', [someone.email]);
        const res=await pool.query('INSERT INTO users(email) VALUES($1) RETURNING *', [someone.email]);
        someone=res.rows[0];
      }
    })

    afterAll(async ()=>{
      if (!MOCK) {
        await pool.query('DELETE FROM users WHERE id=$1', [someone.id])
      }
    })
    test("find by email", async () => {
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByEmail(someone.email.substr(0,5));
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBeNull();
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by email should be caseinsensitive", async () => {
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByEmail(someone.email.substr(2,5).toUpperCase());
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBeNull();
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by email returns empty array when no matches", async () => {
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usrs = await repo.findByEmail('nonexistent@email.com');
      expect(usrs.length).toBe(0);
    });
  })


  describe('findByName',()=>{
    let someone:any={id:'1', email:'someone@example.com', name: 'John Doe'};
    beforeAll(async ()=>{
      if (!MOCK) {
        await pool.query('DELETE FROM users WHERE email=$1', [someone.email]);
        const res=await pool.query('INSERT INTO users(email, name) VALUES($1, $2) RETURNING *', [someone.email, someone.name]);
        someone=res.rows[0];
      }
    })

    afterAll(async ()=>{
      if (!MOCK) {
        await pool.query('DELETE FROM users WHERE id=$1', [someone.id])
      }
    })
    test("find by name", async () => {
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByName(someone.name.substr(0,4));
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBe(someone.name);
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by name should be caseinsensitive", async () => {
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByName(someone.name.substr(2,5).toUpperCase());
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBe(someone.name);
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by name returns empty array when no matches", async () => {
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usrs = await repo.findByName('nonexistent');
      expect(usrs.length).toBe(0);
    });
  })

  describe('findById',()=>{
    let someone:any={id:'1', email:'someone@example.com', name: null};
    beforeAll(async ()=>{
      if (!MOCK) {
        await pool.query('DELETE FROM users WHERE email=$1', [someone.email])
        const res=await pool.query('INSERT INTO users(email, name) VALUES($1, $2) RETURNING *', [someone.email, someone.name]);
        someone=res.rows[0];
      }
    })

    afterAll(async ()=>{
      if (!MOCK) {
        await pool.query('DELETE FROM users WHERE id=$1', [someone.id])
      }
    })
    test("find by id returns matching user object", async () => {
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      const usr = await repo.findById(someone.id);
      expect(usr.email).toBe(someone.email);
      expect(usr.name).toBe(someone.name);
      expect(usr.id).toBe(someone.id);
    });
    test("find by id returns null when no matches", async () => {
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usr = await repo.findById('invalidid');
      expect(usr).toBeNull()
    });
  })


  describe('update',()=>{
    let someone:any={id:'1', email:'someone@example.com', name: 'Some Doe', details:{key1:'value1'}};
    beforeEach(async ()=>{
      if (!MOCK) {
        await pool.query('DELETE FROM users WHERE email=$1', [someone.email])
        const res=await pool.query('INSERT INTO users(email, name, details) VALUES($1, $2, $3) RETURNING *', 
          [someone.email, someone.name, someone.details]);
        someone=res.rows[0];
      }
    })

    afterEach(async ()=>{
      if (!MOCK) {
        await pool.query('DELETE FROM users WHERE id=$1', [someone.id])
      }
    })
    test('update name', async ()=>{
      const newName = 'John Doe';

      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repo.findById(someone.id);
      
      usr.name = newName;
      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [Object.assign({},someone,{name: newName})], rowCount: 1 });
      usr= await repo.update(usr);

      expect(usr).not.toBeNull();
      expect(usr.name).toBe(newName);
    });

    test('update details', async ()=>{
      const newDetails = {key1: 'value2'};

      if (MOCK) pool.query.mockResolvedValue({ rows: [someone], rowCount: 1 });
      let usr = await repo.findById(someone.id);
      usr.details = newDetails;

      if (MOCK) pool.query.mockResolvedValue({ rows: [Object.assign({},someone,{details: newDetails})], rowCount: 1 });
      usr= await repo.update(usr);

      expect(usr).not.toBeNull();
      expect(usr.details["key1"]).toBe(newDetails.key1);
    });
 
    test('update email', async ()=>{
      const newEmail = 'JohnDoe@example.com';

      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repo.findById(someone.id);
      usr.email = newEmail;

      if (MOCK) pool.query.mockResolvedValueOnce({ rows: [Object.assign({},someone,{email: newEmail.toLocaleLowerCase()})], rowCount: 1 });
      usr = await repo.update(usr);
      console.log(usr.toString());
      expect(usr).not.toBeNull();
      expect(usr.email).toBe(newEmail.toLocaleLowerCase());
    });
  })
})