import { Request, Response } from "express";
import { usersTable } from "../db/schema";
import { and, eq, InferSelectModel, sql } from "drizzle-orm";
import {
  findOneBy,
  formatResponse,
  migratePrimaryToSecondary,
} from "../utils/user-functions";
import { db } from "../db/setup";

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        message: "Please provide at least an email or phone number!",
        success: false,
      });
    }

    console.log("Finding user either by email or phone number");

    const findUserByEmail = email
      ? await findOneBy(usersTable, eq(usersTable.email, email))
      : null;
    const findUserByPhoneNumber = phoneNumber
      ? await findOneBy(usersTable, eq(usersTable.phoneNumber, phoneNumber))
      : null;

    console.log(findUserByEmail);
    console.log(findUserByPhoneNumber);

    if (!findUserByEmail && !findUserByPhoneNumber) {
      console.log("No user found creating the contact info");
      const newUser = {
        phoneNumber: phoneNumber || null,
        email: email || null,
        linkedId: null,
        linkPrecedence: "Primary" as "Primary",
        createdAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      };

      const result = await db.insert(usersTable).values(newUser).returning();

      const contact = await formatResponse(result[0]);

      return res.status(200).json({
        contact,
      });
    }

    const primaryUserByEmail = findUserByEmail
      ? findUserByEmail.linkPrecedence === "Primary"
        ? findUserByEmail
        : await db.query.usersTable.findFirst({
            where: eq(usersTable.id, findUserByEmail.linkedId!),
          })
      : null;
    const primaryUserByPhone = findUserByPhoneNumber
      ? findUserByPhoneNumber.linkPrecedence === "Primary"
        ? findUserByPhoneNumber
        : await db.query.usersTable.findFirst({
            where: eq(usersTable.id, findUserByPhoneNumber.linkedId!),
          })
      : null;

    if (
      primaryUserByEmail &&
      primaryUserByPhone &&
      primaryUserByEmail.id !== primaryUserByPhone.id
    ) {
      const olderPrimary =
        primaryUserByEmail.createdAt <= primaryUserByPhone.createdAt
          ? primaryUserByEmail
          : primaryUserByPhone;
      const newerPrimary =
        primaryUserByEmail.createdAt <= primaryUserByPhone.createdAt
          ? primaryUserByPhone
          : primaryUserByEmail;

      await migratePrimaryToSecondary(newerPrimary, olderPrimary);

      const contact = await formatResponse(olderPrimary);

      return res.status(200).json({ contact });
    }

    const primaryUser = primaryUserByEmail || primaryUserByPhone;

    if (primaryUser) {
      const contactExists = await db
        .select()
        .from(usersTable)
        .where(
          and(
            email ? eq(usersTable.email, email) : sql`TRUE`,
            phoneNumber ? eq(usersTable.phoneNumber, phoneNumber) : sql`TRUE`,
            sql`deleted_at IS NULL`
          )
        );

      if (contactExists.length === 0) {
        const newUser = {
          email: email,
          phoneNumber: phoneNumber,
          linkedId: primaryUser.id,
          linkPrecedence: "Secondary" as "Secondary",
          createdAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        };

        await db.insert(usersTable).values(newUser).returning();
      }
      const contact = await formatResponse(primaryUser);

      return res.status(200).json({
        contact,
      });
    }

    return res.status(400).json({
      message: "Invalid request",
    });
  } catch (error) {
    console.log("Error encountered!!", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
