const express = require("express");
const cors = require("cors");

const businessAIRoutes =
  require("./routes/businessAIRoutes");

const phoneRoutes =
  require("./routes/phoneRoutes");

const authRoutes =
  require("./routes/authRoutes");

const saleRoutes =
  require("./routes/saleRoutes");

const branchRoutes =
  require("./routes/branchRoutes");

const transferRoutes =
  require("./routes/transferRoutes");

const valuationRoutes =
  require("./routes/valuationRoutes");

const userRoutes =
  require("./routes/userRoutes");

const dashboardRoutes =
  require("./routes/dashboardRoutes");

const reportRoutes =
  require("./routes/reportRoutes");

const auditRoutes =
  require("./routes/auditRoutes");

const returnRoutes =
  require("./routes/returnRoutes");

const app = express();

const catalogueRoutes = require("./routes/catalogueRoutes");

app.use(cors());

app.use(express.json());

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/phones",
  phoneRoutes
);

app.use(
  "/api/catalogue",
  catalogueRoutes
);

app.use(
  "/api/sales",
  saleRoutes
);

app.use(
  "/api/branches",
  branchRoutes
);

app.use(
  "/api/transfers",
  transferRoutes
);

app.use(
  "/api/valuation",
  valuationRoutes
);

app.use(
  "/api/business-ai",
  businessAIRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/audits",
  auditRoutes
);

app.use(
  "/api/returns",
  returnRoutes
);

app.get(
  "/",
  (req, res) => {
    res.send(
      "Phone Inventory API Running"
    );
  }
);

module.exports = app;