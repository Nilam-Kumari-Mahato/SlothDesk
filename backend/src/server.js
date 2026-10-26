import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => console.log(`SlothDesk API listening on port ${port}`));
server.requestTimeout = 100000;
server.headersTimeout = 105000;
