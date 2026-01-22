const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Allowed origins
const allowedOrigins = ["http://localhost:3000", "http://localhost:3002","https://label.mn","https://www.label.mn","https://admin.label.mn"];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // allow this origin
    } else {
      callback(new Error("Not allowed by CORS")); // block this origin
    }
  }
};

// Enable CORS
app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve static files (images) from the 'app/assets' folder
app.use("/assets", express.static(path.join(__dirname, "app", "assets")));

// Import models (Make sure to update the path if necessary)y
const db = require("./app/models");

// Sync database and handle any errors
async function syncDatabase() {
  try {
    // First, fix the supervisor_id column type issue
    await db.fixSupervisorIdColumn();
    
    // Then sync the database
    await db.sequelize.sync({ alter: true });
    console.log("Synced db.");
  } catch (err) {
    console.log("Failed to sync db: " + err.message);
  }
}

syncDatabase();

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the application." });
});


// Route imports
require("./app/routes/task.routes")(app);

// Route imports
require("./app/routes/auth.routes")(app);

// Role-related routes
require("./app/routes/role.routes")(app);

// User-related routes
require("./app/routes/user.routes")(app);

require("./app/routes/order.routes")(app);

require('./app/routes/product.routes')(app);
require('./app/routes/category.routes')(app);
require('./app/routes/review.routes')(app);
require('./app/routes/cart.routes')(app);
require('./app/routes/variation.routes')(app);
require('./app/routes/color_option.routes')(app);
require('./app/routes/qpay.routes')(app);
require('./app/routes/product_info_image.routes')(app);


// Add error handling for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({ message: "Route not found!" });
});

// set port, listen for requests
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
