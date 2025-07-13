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
  condition: SQL<unknown> | undefined
): Promise<T | undefined> => {
  if (!condition) return undefined;
  const rows = (await db.select().from(table).where(condition)) as User[];

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

  console.log("Contacts", contacts);

  if (contacts.length > 0) {
    const emails = [
      result.email,
      ...contacts.map((c) => c.email).filter((e): e is string => e !== null),
    ];
    contact.emails = [...new Set(emails)];

    const phoneNumbers = [
      result.phoneNumber,
      ...contacts
        .map((c) => c.phoneNumber)
        .filter((e): e is string => e !== null),
    ];
    contact.phoneNumbers = [...new Set(phoneNumbers)];

    contact.secondaryContactsId = contacts.map((c) => c.id);
  }

  console.log(contact);

  return contact;
};
