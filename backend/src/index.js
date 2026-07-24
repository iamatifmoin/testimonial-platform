require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const { initDb } = require("./db/init");
const testimonialRouter = require("./routes/testimonials");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const port = Number(process.env.PORT) || 3001;
const uploadsDir = path.resolve("./uploads");
const widgetPath = path.resolve(__dirname, "../../widget/dist/widget.js");
const demoPagePath = path.resolve(__dirname, "../../demo.html");
const openCors = cors();

function setOpenCors(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}

fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/api", openCors);
app.use("/uploads", setOpenCors, express.static(uploadsDir));
app.use(express.json());

app.use("/api/testimonials", testimonialRouter);

app.get("/demo.html", (req, res) => {
  res.sendFile(demoPagePath);
});

app.get("/widget.js", setOpenCors, (req, res) => {
  if (!fs.existsSync(widgetPath)) {
    console.warn(`Widget bundle not found at ${widgetPath}`);
    return res.status(404).json({ error: "Widget bundle not found" });
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.sendFile(widgetPath);
});

app.use(errorHandler);

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
