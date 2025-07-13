# Bitespeed Assignment

## Overview
This is a Node.js application built with Express, TypeScript, and Drizzle ORM, deployed on Render. It exposes an `/identify` endpoint to identify users based on their email and/or phone number. 

## Deployed Endpoint
The application is hosted on Render, and the `/identify` endpoint is available at:

**URL**: `https://bitespeed-assignment-u6c1.onrender.com/identify`

**Method**: POST

**Request Body**:
The request body accepts `email` and/or `phoneNumber`. Both fields are optional, but at least one must be provided.

```json
{
  "email": "string",
  "phoneNumber": "string"
}
