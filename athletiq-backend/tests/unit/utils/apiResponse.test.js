// tests/unit/utils/apiResponse.test.js
const { ApiResponse, getPaginationInfo } = require('../../../src/utils/apiResponse');

describe('ApiResponse', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('success', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Success message';

      ApiResponse.success(res, data, message);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        data: { id: 1, name: 'Test' }
      });
    });

    it('should return success response without data', () => {
      ApiResponse.success(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success'
      });
    });

    it('should include metadata', () => {
      const data = [];
      const meta = { pagination: { page: 1, limit: 10 } };

      ApiResponse.success(res, data, 'Success', 200, meta);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: [],
        pagination: { page: 1, limit: 10 }
      });
    });
  });

  describe('error', () => {
    it('should return error response', () => {
      const message = 'Error message';

      ApiResponse.error(res, message, 400);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error message'
      });
    });

    it('should include error details', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];

      ApiResponse.error(res, 'Validation failed', 400, errors);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Invalid email' }]
      });
    });
  });

  describe('specialized responses', () => {
    it('should return unauthorized response', () => {
      ApiResponse.unauthorized(res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized access'
      });
    });

    it('should return forbidden response', () => {
      ApiResponse.forbidden(res, 'Custom forbidden message');

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom forbidden message'
      });
    });

    it('should return not found response', () => {
      ApiResponse.notFound(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found'
      });
    });

    it('should return created response', () => {
      const data = { id: 1, name: 'Created item' };

      ApiResponse.created(res, data);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource created successfully',
        data
      });
    });

    it('should return deleted response', () => {
      ApiResponse.deleted(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource deleted successfully'
      });
    });
  });
});

describe('getPaginationInfo', () => {
  it('should calculate pagination correctly', () => {
    const result = getPaginationInfo(1, 10, 25);

    expect(result).toEqual({
      currentPage: 1,
      totalPages: 3,
      totalCount: 25,
      limit: 10,
      hasNext: true,
      hasPrev: false,
      offset: 0
    });
  });

  it('should handle last page correctly', () => {
    const result = getPaginationInfo(3, 10, 25);

    expect(result).toEqual({
      currentPage: 3,
      totalPages: 3,
      totalCount: 25,
      limit: 10,
      hasNext: false,
      hasPrev: true,
      offset: 20
    });
  });

  it('should handle single page correctly', () => {
    const result = getPaginationInfo(1, 10, 5);

    expect(result).toEqual({
      currentPage: 1,
      totalPages: 1,
      totalCount: 5,
      limit: 10,
      hasNext: false,
      hasPrev: false,
      offset: 0
    });
  });
});
