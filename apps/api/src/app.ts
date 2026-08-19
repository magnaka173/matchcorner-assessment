import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.js";
import { createSlipsRouter } from "./routes/slips.js";
import type { BookingService } from "./services/booking.service.js";

export interface AppDependencies {
  bookingService: BookingService;
}

/**
 * Builds the Express application from injected dependencies so tests can run
 * the real router, validation and error handling against a stub operator.
 */
export function createApp({ bookingService }: AppDependencies): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/slips", createSlipsRouter(bookingService));

  app.use(errorHandler);

  return app;
}
