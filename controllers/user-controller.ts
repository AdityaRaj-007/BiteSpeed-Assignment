import { Request, Response } from "express";
import { usersTable } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";
import { findOneBy, formatResponse } from "../utils/user-functions";
import { db } from "../db/setup";

//const db = drizzle({ usersTable });

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Please provide an email!",
        success: false,
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        message: "Please provide a phone number!",
        success: false,
      });
    }

    console.log("Finding user either by email or phone number");

    const findUserByEmail = await findOneBy(
      usersTable,
      and(
        eq(usersTable.email, email),
        eq(usersTable.linkPrecedence, "Primary" as const)
      )
    );
    const findUserByPhoneNumber = await findOneBy(
      usersTable,
      and(
        eq(usersTable.phoneNumber, phoneNumber),
        eq(usersTable.linkPrecedence, "Primary" as const)
      )
    );

    console.log(findUserByEmail);
    console.log(findUserByPhoneNumber);

    if (!findUserByEmail && !findUserByPhoneNumber) {
      console.log("No user found creating the contact info");
      const newUser = {
        phoneNumber: phoneNumber,
        email: email,
        linkedId: null,
        linkPrecedence: "Primary" as "Primary",
      };

      const result = await db.insert(usersTable).values(newUser).returning();

      const contact = await formatResponse(result[0]);

      return res.status(200).json({
        contact,
      });
    } else if (findUserByEmail && findUserByPhoneNumber) {
      if (
        findUserByEmail.email === findUserByPhoneNumber.email &&
        findUserByEmail.phoneNumber === findUserByPhoneNumber.phoneNumber
      ) {
        const primaryUser = findUserByEmail;
        console.log("Email and phoneNumber already exists!!");
        const contact = await formatResponse(primaryUser!);

        return res.status(200).json({
          contact,
        });
      } else {
        const firstUser = findUserByEmail,
          secondUser = findUserByPhoneNumber;

        if (firstUser?.createdAt <= secondUser?.createdAt) {
          console.log("First user is primary!");
          console.log("Updating second contact");
          const result = await db
            .update(usersTable)
            .set({
              linkedId: firstUser.id,
              linkPrecedence: "Secondary",
              updatedAt: sql`NOW()`,
            })
            .where(eq(usersTable.id, secondUser.id))
            .returning();

          console.log("Second contact updated", result);

          const contact = await formatResponse(firstUser);

          return res.status(200).json({
            contact,
          });
        } else {
          console.log("Second user is primary!");
          const result = await db
            .update(usersTable)
            .set({
              linkedId: secondUser.id,
              linkPrecedence: "Secondary",
              updatedAt: sql`NOW()`,
            })
            .where(eq(usersTable.id, firstUser.id))
            .returning();

          console.log(result);

          const contact = await formatResponse(secondUser);

          return res.status(200).json({
            contact,
          });
        }
      }
    } else {
      const primaryUser = findUserByEmail || findUserByPhoneNumber;

      console.log(primaryUser);

      if (!primaryUser?.email || !primaryUser?.phoneNumber) {
        console.log(
          "Primary user email or phone number is missing — skipping query."
        );
        return;
      }

      const contactExists = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.email, email),
            eq(usersTable.phoneNumber, phoneNumber)
          )
        );

      console.log(contactExists);

      if (contactExists.length === 0) {
        const newUser = {
          email: email,
          phoneNumber: phoneNumber,
          linkedId: primaryUser?.id,
          linkPrecedence: "Secondary" as "Secondary",
        };

        console.log("New contact found, adding it as secondary contact!!");

        const result = await db.insert(usersTable).values(newUser).returning();
        console.log(result);
        const contact = await formatResponse(primaryUser!);

        return res.status(200).json({
          contact,
        });
      } else {
        return res.status(200).json({
          message: "Contact exits",
        });
      }
    }
  } catch (error) {
    console.log("Error encountered!!");
  }
};
