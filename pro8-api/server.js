import { createServer } from 'http';
import { handleValidateRequest } from './validate-license.js';

const PORT = Number(process.env.PORT || 8787);

createServer((req, res) => {
  handleValidateRequest(req, res).catch((err) => {
    console.error(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ valid: false, error: 'server_error' }));
  });
}).listen(PORT, () => {
  console.log(`Lovable Pro license API listening on http://localhost:${PORT}`);
  console.log('POST /api/public/validate-license');
});
