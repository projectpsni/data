import User from "../src/user/user";

describe("User", () => {
  const initialData = {
    id: '123',
    name: "Some One",
    email: "SomeOne@example.com",
    picture: "https://example.com/image.png"
  };
  const usr = new User(initialData);
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
   
    expect(data.id).toBe(initialData.id);
    expect(data.email).toBe(initialData.email.toLocaleLowerCase());
    expect(data.name).toBe(initialData.name);
    expect(data.picture).toBe(initialData.picture); 
  })

})