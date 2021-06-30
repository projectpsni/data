
import {Pool} from 'pg';

const MOCKDB=!(process.env.TESTDB);
let getPool = ()=>{
  let pool:any;
  if (!MOCKDB) {
    let connectionString = 'postgresql://postgres@localhost:5432/psitest';
    connectionString = process.env.PSICONNSTR || 'postgresql://postgres@localhost:5432/psitest';
    console.info(`connecting to ${connectionString}`);
    pool = new Pool({ connectionString });
  } else {
    const mPool = {
      connect: jest.fn(),
      query: jest.fn(),
      on: jest.fn(),
    };
    pool = mPool;
  }
  return pool;
}

export default getPool;