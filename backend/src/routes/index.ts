import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { categoryRouter } from "./category.routes.js";
import { customerRouter } from "./customer.routes.js";
import { expenseRouter } from "./expense.routes.js";
import { healthRouter } from "./health.routes.js";
import { productRouter } from "./product.routes.js";
import { reportRouter } from "./report.routes.js";
import { saleRouter } from "./sale.routes.js";

export const apiV1Router = Router();

apiV1Router.use(healthRouter);
apiV1Router.use(authRouter);
apiV1Router.use(productRouter);
apiV1Router.use(categoryRouter);
apiV1Router.use(saleRouter);
apiV1Router.use(expenseRouter);
apiV1Router.use(customerRouter);
apiV1Router.use(reportRouter);
