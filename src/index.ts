import express from "express";
import dotenv from "dotenv";
//import userRoute from "./routes/user-routes";
import userRoute from "./routes/user-routes";

dotenv.config({});

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use("/identify", userRoute);

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
