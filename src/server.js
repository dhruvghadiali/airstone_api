require("module-alias/register");
require("dotenv").config();

const app = require("@src/app");
const connect_database = require("@config/database");

const port = process.env.PORT || 3000;

async function start_server() {
  try {
    await connect_database();

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

start_server();
