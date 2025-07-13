import { db } from "../db/setup";
import { and, eq, inArray, isNull, SQL, sql } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";
import { usersTable } from "../db/schema";

type User = InferSelectModel<typeof usersTable>;

interface ContactResponse {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactsId: number[];
}

export const findOneBy = async (
  table: typeof usersTable,
  condition?: SQL<unknown>
): Promise<User | undefined> => {
  if (!condition) return undefined;

  return await db.query.usersTable.findFirst({
    where: (fields, { and, isNull }) =>
      and(condition, isNull(fields.deletedAt)),
  });
};

export const formatResponse = async (
  primaryUser: User
): Promise<ContactResponse> => {
  const secondaryContacts = await db.query.usersTable.findMany({
    where: (fields, { eq, or, isNull, and }) =>
      and(
        or(
          eq(fields.linkedId, primaryUser.id),
          eq(fields.email, primaryUser.email!),
          eq(fields.phoneNumber, primaryUser.phoneNumber!)
        ),
        isNull(fields.deletedAt),
        eq(fields.linkPrecedence, "Secondary")
      ),
    orderBy: (fields, { asc }) => asc(fields.createdAt),
  });

  const contact: ContactResponse = {
    primaryContactId: primaryUser.id,
    emails: primaryUser.email ? [primaryUser.email] : [],
    phoneNumbers: primaryUser.phoneNumber ? [primaryUser.phoneNumber] : [],
    secondaryContactsId: secondaryContacts.map((c) => c.id),
  };

  if (secondaryContacts.length > 0) {
    const emails = [
      ...contact.emails,
      ...secondaryContacts
        .map((c) => c.email)
        .filter((e): e is string => e !== null),
    ];
    const phoneNumbers = [
      ...contact.phoneNumbers,
      ...secondaryContacts
        .map((c) => c.phoneNumber)
        .filter((p): p is string => p !== null),
    ];

    contact.emails = [...new Set(emails)];
    contact.phoneNumbers = [...new Set(phoneNumbers)];
  }

  return contact;
};

export const changingPrecedence = async (contacts: User[], parent: User) => {
  if (contacts.length === 0) return;

  const contactIds = contacts.map((c) => c.id);

  await db
    .update(usersTable)
    .set({
      linkedId: parent.id,
      updatedAt: sql`NOW()`,
    })
    .where(
      and(inArray(usersTable.id, contactIds), isNull(usersTable.deletedAt))
    );
};

export const migratePrimaryToSecondary = async (
  primaryToConvert: User,
  newPrimary: User
) => {
  try {
    await db
      .update(usersTable)
      .set({
        linkedId: newPrimary.id,
        updatedAt: sql`NOW()`,
      })
      .where(
        and(
          eq(usersTable.linkedId, primaryToConvert.id),
          eq(usersTable.linkPrecedence, "Secondary"),
          isNull(usersTable.deletedAt)
        )
      );

    await db
      .update(usersTable)
      .set({
        linkedId: newPrimary.id,
        linkPrecedence: "Secondary",
        updatedAt: sql`NOW()`,
      })
      .where(eq(usersTable.id, primaryToConvert.id));
  } catch (error) {
    console.error("Error in migratePrimaryToSecondary:", error);
    throw error;
  }
};
