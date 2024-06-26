import { NextApiRequest, NextApiResponse } from 'next';

type Middleware = (req: NextApiRequest, res: NextApiResponse, next: (err?: any) => void) => void;

export function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Middleware) {
  console.log(`Running middleware for ${req.url} with method ${req.method}`);
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        console.error('Middleware error:', result);
        return reject(result);
      }
      console.log('Middleware completed successfully');
      return resolve(result);
    });
  });
}
