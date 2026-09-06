import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { router } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "5mb" }));

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Asmo backend listening on http://localhost:${config.port}/api`);
});
