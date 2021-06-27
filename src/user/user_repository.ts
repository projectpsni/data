import User from './user';

export default interface IUserRepository {
  create(email:string):Promise<User>;
  update(user:User): Promise<User>;

  findById(id:string): Promise<User|null>;
  findByEmail(emailpart:string): Promise<ReadonlyArray<User>>;
  findByName(namepart:string): Promise<ReadonlyArray<User>>;
}
