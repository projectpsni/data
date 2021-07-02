import PG_User_Repository from "../src/user/pg_user_repository";
import getPool from './pool';
import {v4 as uuid} from 'uuid';
import User from "../src/user/user";

let cacheManager = require('cache-manager');

const MOCKDB=!(process.env.TESTDB);
let dbPool = getPool();

describe("pg_user_repository", () => {
  const TABLENAME="users";
 
  const testObjs= async (data:{email:string, name?:string, picture?:string})=>{
    let context = new User({id:uuid(), email: data.email, name: data.name});
    const cache = cacheManager.caching({store: 'memory', ttl: 10/*seconds*/});
    let someone:any = context.toJSON();
    let pool = dbPool;
    if (!MOCKDB) {
      await dbPool.query('DELETE FROM users WHERE email = $1',[data.email.toLocaleLowerCase()])
      const res=await dbPool.query('INSERT INTO users(email, name, picture) VALUES($1, $2, $3) RETURNING id, email, name, picture', 
      [someone.email, someone.name, someone.picture]);
      someone=res.rows[0];
      context=new User(someone);
    } else {
      pool = getPool();
    }
    let repo = new PG_User_Repository(pool, {cache});
    let repowithcontext= new PG_User_Repository(pool, {context});
    return {someone, context, pool, cache, repo, repowithcontext};
  }

  beforeAll(async () => {
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
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@create_example.com'");
      }
    });

    afterAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@create_example.com'");
      }
    });

    test("create user", async () => {
      const {someone, pool, repo} = await testObjs({email:`${uuid()}@create_example.com`});
      const email=`${uuid()}@Create_Example.com`;
      if (MOCKDB) {
        pool.query.mockResolvedValueOnce({ rows: [{...someone, email}], rowCount: 1 });
      }
      const usr = await repo.create(email)
      
      expect(usr.email).toBe(email.toLocaleLowerCase());
      expect(usr.name).toBeNull();
      expect(usr.id).toBeTruthy();
    });
  })

 
  describe('findByEmail',()=>{
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@findbyemail_example.com'");
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@findbyemail_example.com'");
      }
    })
    test("find by email", async () => {
      const {someone, pool, repo} = await testObjs({email:`${uuid()}@findbyemail_example.com`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByEmail(someone.email.substr(0,5));
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBeNull();
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by email should be caseinsensitive", async () => {
      const {someone, pool, repo} = await testObjs({email:`${uuid()}@findbyemail_example.com`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByEmail(someone.email.substr(2,5).toUpperCase());
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBeNull();
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by email returns empty array when no matches", async () => {
      const {pool, repo} = await testObjs({email:`${uuid()}@findbyemail_example.com`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usrs = await repo.findByEmail('nonexistent@email.com');
      expect(usrs.length).toBe(0);
    });
  })


  describe('findByName',()=>{
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@findbyname_example.com'");
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@findbyname_example.com'");
      }
    })
    test("find by name", async () => {
      const {someone, pool, repo} = await testObjs({email:`${uuid()}@findbyname_example.com`, name: 'John Doe'});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByName(someone.name.substr(0,4));
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBe(someone.name);
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by name should be caseinsensitive", async () => {
      const {someone, pool, repo} = await testObjs({email:`${uuid()}@findbyname_example.com`, name:'Insensitive User'});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone]});
      const usrs = await repo.findByName(someone.name.substr(2,5).toUpperCase());
      expect(usrs.length).toBe(1);
      expect(usrs[0].email).toBe(someone.email);
      expect(usrs[0].name).toBe(someone.name);
      expect(usrs[0].id).toBe(someone.id);
    });
    test("find by name returns empty array when no matches", async () => {
      const {pool, repo} = await testObjs({email:`${uuid()}@findbyname_example.com`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usrs = await repo.findByName('nonexistent');
      expect(usrs.length).toBe(0);
    });
  })

  describe('findById',()=>{
    beforeAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@findbyid_example.com'");
      }
    })

    afterAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@findbyid_example.com'");
      }
    })
    test("find by id returns matching user object", async () => {
      const {someone, pool, cache, repo} = await testObjs({email:`${uuid()}@findbyid_example.com`});
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
      const {pool, repo} = await testObjs({email:`${uuid()}@findbyid_example.com`});
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const usr = await repo.findById('invalidid');
      expect(usr).toBeNull()
    });
    test("find by id returns matching user object from cache", async () => {
      const {someone, cache, repo} = await testObjs({email:`${uuid()}@findbyid_example.com`});
      await cache.set(`user.cacheid`, someone);
      const usr = await repo.findById('cacheid');
      expect(usr.email).toBe(someone.email);
      expect(usr.name).toBe(someone.name);
      expect(usr.id).toBe(someone.id);
      await cache.del(`user.cacheid`);
    });
  })


  describe('update',()=>{
    beforeAll(async ()=>{
      await dbPool.query("DELETE FROM users WHERE email LIKE '%@update_example.com'");
    });

    afterAll(async ()=>{
      if (!MOCKDB) {
        await dbPool.query("DELETE FROM users WHERE email LIKE '%@update_example.com'");
      }
    })
    test('update name without context should return null', async ()=>{
      const {someone, pool, repo} = await testObjs({email:`${uuid()}@update_example.com`, name:'Update Name'});
      const newName = 'John Doe';

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repo.findById(someone.id);
     
      usr.name = newName;
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [Object.assign({}, someone, {name: newName})], rowCount: 1 });
      usr= await repo.update(usr);

      expect(usr).toBeNull();
    });

    test('update name with context of same user', async ()=>{
      const {someone, pool, repowithcontext} = await testObjs({email:`${uuid()}@update_example.com`});
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

      const {someone, pool, repowithcontext} = await testObjs({email:`${uuid()}@update_example.com`});

      const newName = 'John Doe';

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repowithcontext.findById(someone.id);
      
      usr.name = newName;

      let repowithnewcontext= new PG_User_Repository(pool, {context:new User({id: uuid(), email:'notme@example.com'})}); 
      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [Object.assign({},someone,{name: newName})], rowCount: 1 });
      usr= await repowithnewcontext.update(usr);

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
      const {someone, pool, repowithcontext} = await testObjs({email:`${uuid()}-ue@update_example.com`});
      const newEmail = 'JohnDoe@example.com';

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [someone], rowCount: 1 });
      let usr = await repowithcontext.findById(someone.id);
      usr.email = newEmail;

      if (MOCKDB) pool.query.mockResolvedValueOnce({ rows: [Object.assign({},someone,{email: newEmail.toLocaleLowerCase()})], rowCount: 1 });
      usr = await repowithcontext.update(usr);
      expect(usr).not.toBeNull();
      expect(usr.email).toBe(newEmail.toLocaleLowerCase());
    });
  })
})