import { HttpError } from '../../errors/HttpError.js';

describe('HttpError - Unit Tests', () => {
  it('should create an HttpError instance', () => {
    const error = new HttpError('Test error', 400);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
  });

  it('should have correct error properties', () => {
    const error = new HttpError('Not found', 404);

    expect(error.name).toBe('Error');
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
  });

  it('should work with different status codes', () => {
    const error400 = new HttpError('Bad Request', 400);
    const error404 = new HttpError('Not Found', 404);
    const error500 = new HttpError('Internal Error', 500);

    expect(error400.statusCode).toBe(400);
    expect(error404.statusCode).toBe(404);
    expect(error500.statusCode).toBe(500);
  });

  it('should be throwable and catchable', () => {
    const error = new HttpError('Test error', 400);

    expect(() => {
      throw error;
    }).toThrow('Test error');

    try {
      throw error;
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).statusCode).toBe(400);
    }
  });

  it('should maintain error stack trace', () => {
    const error = new HttpError('Test error', 400);

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });

  it('should work in instanceof checks', () => {
    const error = new HttpError('Test error', 400);

    expect(error instanceof HttpError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

