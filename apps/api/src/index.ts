import "dotenv/config";
import { createApp } from "./app.js";
import { BetwayNigeriaOperator } from "./operators/betway/betway.operator.js";
import { BookingService } from "./services/booking.service.js";

const port = Number(process.env.PORT ?? 4000);

const app = createApp({
  bookingService: new BookingService(new BetwayNigeriaOperator())
});

app.listen(port, () => {
  console.log(`MatchCorner API listening on http://localhost:${port}`);
});
