const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const phoneRoutes = require("./routes/phoneRoutes");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();


// MIDDLEWARE
app.use(cors());
app.use(express.json());


// ROUTES
app.use("/api/phones", phoneRoutes);
app.use("/api/auth", authRoutes);


app.get("/", (req, res) => {
  res.send("Phone Inventory API Running");
});


const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error));