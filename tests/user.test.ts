import User from "../src/user/user";

describe("User", () => {
  const usr = new User({
    id: '123',
    name: "Some One",
    email: "someone@example.com"
  });
  test("toString", () => {
    expect(usr.toString()).toBe("123:someone@example.com");
  });

  test("toJSON", ()=>{
    const data:any = usr.toJSON();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('picture');

    expect(data.id).toBe(usr.id);
    expect(data.email).toBe(usr.email);
    expect(data.name).toBe(usr.name);
    expect(data.picture).toBe(usr.picture);
  })

})