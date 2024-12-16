export const checkCrosswordSession = async (req, res, next) => {
  try {
    const session = req.cookies.crosswordSession;
    
    if (!session || !session.crosswordId) {
      return res.status(401).json({
        success: false,
        message: 'Phiên làm việc không hợp lệ hoặc đã hết hạn',
        redirect: '/create-new'
      });
    }

    next();
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra phiên làm việc'
    });
  }
}; 