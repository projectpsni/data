
import Role from './role';

export default interface IRoleRepository {
  create(name:string):Promise<Role>;
  update(role:Role): Promise<Role>;

  findById(id:string): Promise<Role|null>;
  findByName(namepart:string): Promise<ReadonlyArray<Role>>;
}