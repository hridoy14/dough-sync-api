// Vercel Serverless endpoint:
//   POST https://<your-project>.vercel.app/api/public/validate-license
import { handleValidateRequest } from '../../validate-license.js'

export default async function handler(req, res) {
  return handleValidateRequest(req, res)
}
