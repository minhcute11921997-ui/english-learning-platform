/**
 * Chuẩn hóa format JSON response
 */
class ApiResponse {
  /**
   * Response thành công
   */
  static success(res, data = null, message = 'Thành công', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data
    });
  }

  /**
   * Response thành công với pagination
   */
  static paginated(res, data, pagination, message = 'Thành công') {
    return res.status(200).json({
      status: 'success',
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    });
  }

  /**
   * Response tạo mới thành công
   */
  static created(res, data, message = 'Tạo mới thành công') {
    return res.status(201).json({
      status: 'success',
      message,
      data
    });
  }

  /**
   * Response lỗi
   */
  static error(res, message = 'Đã có lỗi xảy ra', statusCode = 500) {
    return res.status(statusCode).json({
      status: 'error',
      message
    });
  }
}

module.exports = ApiResponse;
