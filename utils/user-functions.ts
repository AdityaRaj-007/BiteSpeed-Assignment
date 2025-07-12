import { db } from "../db/setup";
import { asc, eq, SQL } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";
import { usersTable, linkEnum } from "../db/schema";

type User = InferSelectModel<typeof usersTable>;

interface ContactResponse {
  primaryContactId: number;
  emails: (string | null)[];
  phoneNumbers: (string | null)[];
  secondaryContactsId: number[];
}

export const findOneBy = async <T extends User>(
  table: typeof usersTable,
  condition: SQL
): Promise<T | undefined> => {
  const rows = (await db
    .select()
    .from(table)
    .where(condition)
    .orderBy(asc(table.createdAt))
    .limit(1)) as User[];

  return rows[0] as T | undefined;
};

export const formatResponse = async (
  result: User
): Promise<ContactResponse> => {
  const id = result.id;

  const contacts = await db.query.usersTable.findMany({
    where: (fields, { eq }) => eq(fields.linkedId, id),
  });

  const contact: ContactResponse = {
    primaryContactId: id,
    emails: [result.email],
    phoneNumbers: [result.phoneNumber],
    secondaryContactsId: [],
  };

  if (contacts.length > 0) {
  }

  return contact;
};
