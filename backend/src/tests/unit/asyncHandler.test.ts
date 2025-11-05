import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';

describe('asyncHandler - Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should call the handler function successfully', async () => {
    const handler = async (req: Request, res: Response) => {
      res.status(200).json({ success: true });
    };

    const wrappedHandler = asyncHandler(handler);
    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle errors and call next', async () => {
    const error = new Error('Test error');
    const handler = async (req: Request, res: Response) => {
      throw error;
    };

    const wrappedHandler = asyncHandler(handler);
    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should handle async errors', async () => {
    const error = new Error('Async error');
    const handler = async (req: Request, res: Response) => {
      await Promise.resolve();
      throw error;
    };

    const wrappedHandler = asyncHandler(handler);
    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should work with handlers that do not return a value', async () => {
    const handler = async (req: Request, res: Response) => {
      res.send('OK');
    };

    const wrappedHandler = asyncHandler(handler);
    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.send).toHaveBeenCalledWith('OK');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle HttpError instances correctly', async () => {
    const { HttpError } = require('../../errors/HttpError');
    const httpError = new HttpError('Not found', 404);

    const handler = async (req: Request, res: Response) => {
      throw httpError;
    };

    const wrappedHandler = asyncHandler(handler);
    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(httpError);
  });

  it('should handle handlers with different request types', async () => {
    interface CustomRequest extends Request {
      customProp?: string;
    }

    const handler = async (req: CustomRequest, res: Response) => {
      req.customProp = 'test';
      res.json({ customProp: req.customProp });
    };

    const wrappedHandler = asyncHandler<CustomRequest>(handler);
    await wrappedHandler(mockReq as CustomRequest, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ customProp: 'test' });
  });
});

