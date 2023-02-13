import User from "../schemas/user-schema";

export default async function databaseClear() {
  await User.deleteMany({});
}
