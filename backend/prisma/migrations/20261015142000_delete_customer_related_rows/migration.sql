-- Keep the buyer name on a sale after the customer row is deleted.
ALTER TABLE "sales" ADD COLUMN "customer_name_snapshot" TEXT;

UPDATE "sales" AS sale
SET "customer_name_snapshot" = customer."name"
FROM "customers" AS customer
WHERE sale."customer_id" = customer."id"
  AND sale."customer_name_snapshot" IS NULL;

-- Repayment rows are removed with the customer.
ALTER TABLE "customer_repayments" DROP CONSTRAINT "customer_repayments_customer_id_fkey";

ALTER TABLE "customer_repayments" ADD CONSTRAINT "customer_repayments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
