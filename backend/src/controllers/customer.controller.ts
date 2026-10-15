import type { Request, Response } from "express";
import { sendSuccess } from "../lib/api-response.js";
import {
  serializeCustomer,
  serializeRepayment,
  serializeSale,
} from "../lib/serialize.js";
import {
  createCustomerSchema,
  createRepaymentSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "../schemas/customer.schema.js";
import {
  createCustomer,
  getCustomerDetail,
  listCustomers,
  recordRepayment,
  removeCustomer,
  updateCustomer,
} from "../services/customer.service.js";

function shopId(req: Request): string {
  return req.auth!.shopId;
}

export async function getCustomers(req: Request, res: Response): Promise<void> {
  const query = listCustomersQuerySchema.parse(req.query);
  const page = await listCustomers(shopId(req), query);
  sendSuccess(res, {
    ...page,
    items: page.items.map(serializeCustomer),
  });
}

export async function postCustomer(req: Request, res: Response): Promise<void> {
  const input = createCustomerSchema.parse(req.body);
  const customer = await createCustomer(shopId(req), input);
  sendSuccess(res, serializeCustomer({ ...customer, outstandingBalance: "0.00" }), 201);
}

export async function getCustomer(req: Request, res: Response): Promise<void> {
  const detail = await getCustomerDetail(shopId(req), req.params.id as string);
  sendSuccess(res, {
    ...serializeCustomer({
      ...detail.customer,
      outstandingBalance: detail.outstandingBalance,
    }),
    sales: detail.sales.map(serializeSale),
    repayments: detail.repayments.map(serializeRepayment),
  });
}

export async function patchCustomer(req: Request, res: Response): Promise<void> {
  const input = updateCustomerSchema.parse(req.body);
  const customer = await updateCustomer(
    shopId(req),
    req.params.id as string,
    input,
  );
  const detail = await getCustomerDetail(shopId(req), customer.id);
  sendSuccess(
    res,
    serializeCustomer({
      ...detail.customer,
      outstandingBalance: detail.outstandingBalance,
    }),
  );
}

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  await removeCustomer(shopId(req), req.params.id as string);
  sendSuccess(res, { removed: true });
}

export async function postRepayment(req: Request, res: Response): Promise<void> {
  const input = createRepaymentSchema.parse(req.body);
  const result = await recordRepayment(
    shopId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(
    res,
    {
      sale: serializeSale(result.sale),
      outstandingBalance: result.outstandingBalance,
    },
    201,
  );
}
