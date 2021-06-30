import IUserRepository from "../src/user/user_repository";
import PG_User_Repository from "../src/user/pg_user_repository";
import getPool from './pool';
import {v4 as uuid} from 'uuid';
import User from "../src/user/user";

let cacheManager = require('cache-manager');

const MOCKDB=!(process.env.TESTDB);

describe("pg_user_repository", () => {
  let repo:IUserRepository;
  let pool:any;
  const cache = cacheManager.caching({store: 'memory', ttl: 10/*seconds*/});
  const TABLENAME="users";
 
  beforeAll(async()=>{
    if (repo) return;
    pool = getPool();
    repo = new PG_User_Repository(pool, {cache});
  });

  afterAll(async () => {
    if (!MOCKDB) {
      await pool.query(`DELETE FROM ${TABLENAME}`);
      await pool.end();
    }
    jest.clearAllMocks();
  });


  describe("create",()=>{
    const email = 'SomeOne@Create_example.com';
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await pool.query("DELETE FROM users WHERE email='someone@create_example.com'");
      }
    });

    afterAll(async ()=>{
      if (!MOCKDB) {
        await pool.query("DELETE FROM users WHERE email='someone@create_example.com'");
      }
    });

    test("create user", async () => {
      if (MOCKDB) {
        pool.query.mockResolvedValueOnce({ rows: [{id:uuid(), email:email.toLocaleLowerCase(), name: null}], rowCount: 1 });
      }
      const usr = await repo.create(email)
      
      expect(usr.email).toBe(email.toLocaleLowerCase());
      expect(usr.name).toBeNull();
      expect(usr.id).toBeTruthy();
    });
  })

 
  describe('findByEmail',()=>{
    let someone:any={id:uuid(), email:'someone@findbyemail_example.com', name: null};
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM users WHERE email=$1', [someone.email]);
        const res=await pool.query('INSERT INTO users(email) VALUES($1) RETURNING id, email, name', [someone.email]);
        someone=res.rows[0];
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM users WHERE id=$1', [someone.id])
      }
    })
    test("find by email", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByEmail(someone.email.substr(0,5));
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBeNull();
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by email should be caseinsensitive", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByEmail(someone.email.substr(2,5).toUpperCase());
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBeNull();
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by email returns empty array when no matches", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usrs = await repo.findByEmail('nonexistent@email.com');
      expect(usrs.length).toBe(0);
    });
  })


  describe('findByName',()=>{
    let someone:any={id:uuid(), email:'someone@findbyname_example.com', name: 'John Doe'};
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM users WHERE email=$1', [someone.email]);
        const res=await pool.query('INSERT INTO users(email, name) VALUES($1, $2) RETURNING id, email, name', [someone.email, someone.name]);
        someone=res.rows[0];
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM users WHERE id=$1', [someone.id])
      }
    })
    test("find by name", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByName(someone.name.substr(0,4));
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBe(someone.name);
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by name should be caseinsensitive", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByName(someone.name.substr(2,5).toUpperCase());
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBe(someone.name);
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by name returns empty array when no matches", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usrs = await repo.findByName('nonexistent');
      expect(usrs.length).toBe(0);
    });
  })

  describe('findById',()=>{
    let someone:any={id:uuid(), email:'someone@findbyid_example.com', name: null};
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM users WHERE email=$1', [someone.email])
        const res=await pool.query('INSERT INTO users(email, name) VALUES($1, $2) RETURNING id, email, name', [someone.email, someone.name]);
        someone=res.rows[0];
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM users WHERE id=$1', [someone.id])
      }
    })
    test("find by id returns matching user object", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      const cachekey = `user.${someone.id}`;
      let cachedobject = await cache.get(cachekey);
      expect(cachedobject).toBeUndefined();
      const usr = await repo.findById(someone.id);
      expect(usr.email).toBe(someone.email);
      expect(usr.name).toBe(someone.name);
      expect(usr.id).toBe(someone.id);
      cachedobject = await cache.get(cachekey);
      expect(cachedobject).toBeDefined();
      await cache.del(cachekey);
    });
    test("find by id returns null when no matches", async () => {
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usr = await repo.findById('invalidid');
      expect(usr).toBeNull()
    });
    test("find by id returns matching user object from cache", async () => {
      await cache.set(`user.cacheid`, someone);
      const usr = await repo.findById('cacheid');
      expect(usr.email).toBe(someone.email);
      expect(usr.name).toBe(someone.name);
      expect(usr.id).toBe(someone.id);
      await cache.del(`user.cacheid`);
    });
  })


  describe('update',()=>{
    let repowithcontext:IUserRepository;
    let context:User;
    let someone:any;
    beforeEach(async ()=>{
      context = new User({id:uuid(), email:'actionuser@update_example.com', name:'Action User'});
      someone = context.toJSON();
      if (!MOCKDB) {
        await pool.query('DELETE FROM users WHERE email=$1', [someone.email])
        const res=await pool.query('INSERT INTO users(email, name) VALUES($1, $2) RETURNING id, email, name', 
        [someone.email, someone.name]);
        someone=res.rows[0];
        context=new User(someone);
      }
      repowithcontext= new PG_User_Repository(pool, {context});
    })

    afterEach(async ()=>{
      if (!MOCKDB) {
        await pool.query('DELETE FROM users WHERE id=$1', [someone.id])
      }
    })
    test('update name without context should return null', async ()=>{
      const newName = 'John Doe';

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repo.findById(someone.id);
     
      usr.name = newName;
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [Object.assign({}, someone, {name: newName})], rowCount: 1 });
      usr= await repo.update(usr);

      expect(usr).toBeNull();
    });

    test('update name with context of same user', async ()=>{
      const newName = 'John Doe';

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repowithcontext.findById(someone.id);
      
      usr.name = newName;
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [Object.assign({}, someone, {name: newName})], rowCount: 1 });
      usr= await repowithcontext.update(usr);

      expect(usr).not.toBeNull();
      expect(usr.name).toBe(newName);
    });
    test('update name with context of diff user should fail', async ()=>{
      const newName = 'John Doe';

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repo.findById(someone.id);
      
      usr.name = newName;

      let repowithcontext= new PG_User_Repository(pool, {context:new User({id: uuid(), email:'notme@example.com'})}); 
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [Object.assign({},someone,{name: newName})], rowCount: 1 });
      usr= await repowithcontext.update(usr);

      expect(usr).toBeNull();
    });

    // test('update details', async ()=>{
    //   const newDetails = {key1: 'value2'};

    //   if (MOCKDB) pool.query.mockResolvedValue({ rows: [someone], rowCount: 1 });
    //   let usr = await repo.findById(someone.id);
    //   usr.details = newDetails;

    //   if (MOCKDB) pool.query.mockResolvedValue({ rows: [Object.assign({},someone,{details: newDetails})], rowCount: 1 });
    //   usr= await repo.update(usr);

    //   expect(usr).not.toBeNull();
    //   expect(usr.details["key1"]).toBe(newDetails.key1);
    // });
 
    test('update email', async ()=>{
      const newEmail = 'JohnDoe@example.com';

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repo.findById(someone.id);
      usr.email = newEmail;

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [Object.assign({},someone,{email: newEmail.toLocaleLowerCase()})], rowCount: 1 });
      usr = await repowithcontext.update(usr);
      expect(usr).not.toBeNull();
      expect(usr.email).toBe(newEmail.toLocaleLowerCase());
    });
  })
})