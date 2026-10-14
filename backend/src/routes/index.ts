import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { categoryRouter } from "./category.routes.js";
import { healthRouter } from "./health.routes.js";
import { productRouter } from "./product.routes.js";

export const apiV1Router = Router();

apiV1Router.use(healthRouter);
apiV1Router.use(authRouter);
apiV1Router.use(productRouter);
apiV1Router.use(categoryRouter);
