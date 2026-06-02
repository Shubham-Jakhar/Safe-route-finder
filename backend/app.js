const express = require('express');
const app = express();
app.use(express.json());
const { default: mongoose } = require('mongoose');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH;
const userRouter = require('./routes/userRouter');

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Backend is deployed and running successfully!"
  });
});
app.use("/user", userRouter);
userRouter.get("/test", (req, res) => {
    res.json({ message: "user route working" });
});
app.use((req, res, next) => {
  res.status(404).send("404 Page Not Found");
});

const PORT = 3000;
mongoose.connect(DB_PATH).then(() => {
   app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.log("error while connecting mongoose", error);
})

module.exports = app;