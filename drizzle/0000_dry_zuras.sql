CREATE TYPE "public"."link" AS ENUM('Primary', 'Secondary');--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"phone_number" varchar(10),
	"email" varchar(256),
	"linked_id" integer,
	"link_precedence" "link" DEFAULT 'Primary',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);

ALTER TABLE "users"
ADD CONSTRAINT "fk_linked_id" FOREIGN KEY ("linked_id") REFERENCES "users" ("id") ON DELETE SET NULL;