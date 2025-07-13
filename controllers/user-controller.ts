import { Request, Response } from "express";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { findOneBy, formatResponse } from "../utils/user-functions";
import { db } from "../db/setup";

//const db = drizzle({ usersTable });

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email) {
      res.status(400).json({
        message: "Please provide an email!",
        success: false,
      });
    }

    if (!phoneNumber) {
      res.status(400).json({
        message: "Please provide a phone number!",
        success: false,
      });
    }

    console.log("Finding user either by email or phone number");

    const findUserByEmail = await findOneBy(
      usersTable,
      eq(usersTable.email, email)
    );
    const findUserByPhoneNumber = await findOneBy(
      usersTable,
      eq(usersTable.phoneNumber, phoneNumber)
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
      const primaryUser = findUserByEmail || findUserByPhoneNumber;

      console.log(primaryUser);
      if (findUserByEmail === findUserByPhoneNumber) {
        console.log("Email and phoneNumber already exists!!");
        const contact = await formatResponse(primaryUser!);

        return res.status(200).json({
          contact,
        });
      }
    } else {
      const primaryUser = findUserByEmail || findUserByPhoneNumber;

      console.log(primaryUser);

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
    }
  } catch (error) {
    console.log("Error encountered!!");
  }
};
