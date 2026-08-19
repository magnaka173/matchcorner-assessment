import "dotenv/config";
import { createApp } from "./app.js";
import { prisma } from "./db/prisma.js";
import { BetwayNigeriaOperator } from "./operators/betway/betway.operator.js";
import { PrismaAuditRepository } from "./repositories/prisma-audit.repository.js";
import { BookingService } from "./services/booking.service.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const app = createApp({
  bookingService: new BookingService(new BetwayNigeriaOperator(), new PrismaAuditRepository(prisma))
});

app.listen(port, host, () => {
  console.log(`MatchCorner API listening on ${host}:${port}`);
});
