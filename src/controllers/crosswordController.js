import Crossword from '../models/Crossword.js';
import CryptoJS from 'crypto-js';

export const crosswordController = {
  create: async (req, res) => {
    try {
      console.log('Create Crossword Request:', {
        body: req.body,
        userId: req.user._id,
        userName: req.user.username,
        fullName: req.user.fullName
      });
      
      const { title, status, gradeLevel, subject } = req.body;
      
      // Validate đầu vào
      if (!title || !status || !gradeLevel || !subject) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin'
        });
      }

      // Validate status
      if (!['Công khai', 'Không công khai'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }

      // Tạo ô chữ mới với thông tin tác giả đầy đủ
      const newCrossword = new Crossword({
        title,
        status,
        gradeLevel,
        subject,
        author: req.user._id,
        authorName: req.user.fullName || req.user.username,
        mainKeyword: []
      });

      await newCrossword.save();
      
      console.log('Crossword created:', {
        id: newCrossword._id,
        author: newCrossword.author,
        authorName: newCrossword.authorName
      });

      // Set cookie cho phiên tạo ô chữ
      res.cookie('crosswordSession', {
        crosswordId: newCrossword._id,
        action: 'create'
      }, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000, // 1 giờ
        sameSite: 'strict'
      });

      res.status(201).json({
        success: true,
        message: 'Tạo ô chữ thành công',
        data: newCrossword
      });

    } catch (error) {
      console.error('Create crossword error:', error);
      
      // Check lỗi validation của mongoose
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: Object.values(error.errors).map(err => err.message).join(', ')
        });
      }

      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tạo ô chữ'
      });
    }
  },

  // Lấy dữ liệu phiên hiện tại
  getCurrentSession: async (req, res) => {
    try {
      const session = req.cookies.crosswordSession;
      
      if (!session || !session.crosswordId) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiên làm việc'
        });
      }

      const crossword = await Crossword.findById(session.crosswordId);
      
      if (!crossword) {
        res.clearCookie('crosswordSession');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ'
        });
      }

      // Kiểm tra quyền sở hữu
      if (crossword.author.toString() !== req.user._id.toString()) {
        res.clearCookie('crosswordSession');
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập ô chữ này'
        });
      }

      res.json({
        success: true,
        data: crossword
      });

    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin phiên làm việc'
      });
    }
  },

  // Lưu và kết thúc phiên
  saveAndEndSession: async (req, res) => {
    try {
      const session = req.cookies.crosswordSession;
      
      if (!session || !session.crosswordId) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiên làm việc'
        });
      }

      const { mainKeyword } = req.body;
      const crossword = await Crossword.findById(session.crosswordId);

      if (!crossword) {
        res.clearCookie('crosswordSession');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ'
        });
      }

      // Cập nhật dữ liệu
      crossword.mainKeyword = mainKeyword;
      await crossword.save();

      // Xóa cookie phiên
      res.clearCookie('crosswordSession');

      res.json({
        success: true,
        message: 'Lưu ô chữ thành công',
        data: crossword
      });

    } catch (error) {
      console.error('Save session error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu ô chữ'
      });
    }
  },

  endSession: async (req, res) => {
    try {
      // Xóa cookie phiên
      res.clearCookie('crosswordSession', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.status(200).json({
        success: true,
        message: 'Đã kết thúc phiên làm việc'
      });
    } catch (error) {
      console.error('End session error:', error);
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi kết thúc phiên làm việc'
      });
    }
  },

  saveCrossword: async (req, res) => {
    try {
      const { mainKeyword } = req.body;
      const session = req.cookies.crosswordSession;

      if (!session || !session.crosswordId) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy phiên làm việc'
        });
      }

      // Validate dữ liệu đầu vào
      if (!mainKeyword || !Array.isArray(mainKeyword) || mainKeyword.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu ô chữ không hợp lệ'
        });
      }

      // Validate từ khóa chính và các câu hỏi
      const keywordData = mainKeyword[0];
      if (!keywordData.keyword || !Array.isArray(keywordData.associatedHorizontalKeywords)) {
        return res.status(400).json({
          success: false,
          message: 'Cấu trúc dữ liệu không hợp lệ'
        });
      }

      // Tìm và cập nhật crossword
      const crossword = await Crossword.findById(session.crosswordId);
      if (!crossword) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ'
        });
      }

      // Cập nhật dữ liệu
      crossword.mainKeyword = mainKeyword;
      await crossword.save();

      // Xóa cookie session sau khi lưu thành công
      res.clearCookie('crosswordSession', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.status(200).json({
        success: true,
        message: 'Lưu ô chữ thành công',
        data: crossword
      });

    } catch (error) {
      console.error('Save crossword error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu ô chữ',
        error: error.message
      });
    }
  },

  getUserCrosswords: async (req, res) => {
    try {
      const userId = req.user._id;
      
      // Lấy tất cả crosswords của user, không cần phân trang
      const crosswords = await Crossword.find({ author: userId })
        .populate('author', 'fullName')
        .sort({ createdAt: -1 });

      const formattedCrosswords = crosswords.map(crossword => ({
        _id: crossword._id,
        title: crossword.title || 'Ô chữ không có tên',
        questionCount: crossword.mainKeyword[0]?.keyword?.length || 0,
        author: crossword.author?.fullName || 'Ẩn danh',
        status: crossword.status,
        subject: crossword.subject,
        grade: crossword.gradeLevel,
        timesPlayed: crossword.timesPlayed || 0
      }));

      res.json({
        success: true,
        data: formattedCrosswords
      });

    } catch (error) {
      console.error('Get user crosswords error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách ô chữ',
        error: error.message
      });
    }
  },

  updateCrossword: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, status, subject, grade } = req.body;
      const userId = req.user._id;

      // Validate input
      if (!title || !status || !subject || !grade) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin'
        });
      }

      // Validate status
      if (!['Công khai', 'Không công khai'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }

      // Tìm ô chữ và kiểm tra quyền sở hữu
      const crossword = await Crossword.findOne({ _id: id, author: userId });
      
      if (!crossword) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ hoặc bạn không có quyền chỉnh sửa'
        });
      }

      // Cập nhật thông tin
      crossword.title = title;
      crossword.status = status;
      crossword.subject = subject;
      crossword.gradeLevel = grade;

      await crossword.save();

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin ô chữ thành công',
        data: {
          _id: crossword._id,
          title: crossword.title,
          status: crossword.status,
          subject: crossword.subject,
          grade: crossword.gradeLevel,
          author: crossword.authorName,
          questionCount: crossword.mainKeyword[0]?.associatedHorizontalKeywords?.length || 0,
          timesPlayed: crossword.timesPlayed || 0
        }
      });

    } catch (error) {
      console.error('Update crossword error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: Object.values(error.errors).map(err => err.message).join(', ')
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin ô chữ'
      });
    }
  },

  startEditSession: async (req, res) => {
    try {
      const { id } = req.params;
      const crossword = await Crossword.findById(id);
      
      if (!crossword) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ'
        });
      }

      // Set cookie phiên chỉnh sửa
      res.cookie('crosswordSession', {
        crosswordId: id,
        action: 'edit'
      }, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000, // 1 giờ
        sameSite: 'strict'
      });

      // Trả về toàn bộ dữ liệu mainKeyword
      res.json({
        success: true,
        data: crossword.mainKeyword
      });

    } catch (error) {
      console.error('Start edit session error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi bắt đầu phiên chỉnh sửa'
      });
    }
  },

  getLibraryCrosswords: async (_req, res) => {
    try {
      // Lấy 5 ô chữ ngẫu nhiên có trạng thái "Công khai"
      const randomCrosswords = await Crossword.aggregate([
        { $match: { status: "Công khai" } },
        { $sample: { size: 5 } }
      ]);

      // Lấy 5 ô chữ được chơi nhiều nhất (giả sử có field playCount)
      const mostPlayedCrosswords = await Crossword.find({ status: "Công khai" })
        .sort({ timesPlayed: -1 })
        .limit(5);

      // Lấy 5 ô chữ mới nhất
      const newestCrosswords = await Crossword.find({ status: "Công khai" })
        .sort({ createdAt: -1 })
        .limit(5);

      // Format dữ liệu trước khi trả về
      const formatCrosswords = (crosswords) => {
        return crosswords.map(crossword => ({
          _id: crossword._id,
          title: crossword.title || 'Ô chữ không có tên',
          questionCount: crossword.mainKeyword[0]?.associatedHorizontalKeywords?.length || 0,
          author: crossword.authorName || 'Ẩn danh',
          grade: crossword.gradeLevel,
          subject: crossword.subject,
          createdAt: crossword.createdAt,
          timesPlayed: crossword.timesPlayed || 0
        }));
      };

      res.json({
        success: true,
        data: {
          random: formatCrosswords(randomCrosswords),
          mostPlayed: formatCrosswords(mostPlayedCrosswords),
          newest: formatCrosswords(newestCrosswords)
        }
      });

    } catch (error) {
      console.error('Get library crosswords error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách ô chữ thư viện'
      });
    }
  },

  startPlay: async (req, res) => {
    try {
      const { id } = req.params;
      const { mode } = req.body;

      const crossword = await Crossword.findById(id);
      if (!crossword) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ'
        });
      }

      // Tăng số lần chơi
      crossword.timesPlayed = (crossword.timesPlayed || 0) + 1;
      await crossword.save();

      // Set cookie cho phiên chơi
      res.cookie('playSession', {
        crosswordId: id,
        mode: mode,
        startTime: new Date()
      }, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 2 * 60 * 60 * 500, // 1 giờ
        sameSite: 'strict'
      });

      // Lấy secretKey từ cùng logic với hàm GetSecretKey
      const key = process.env.ANSWER_ENCRYPTION_KEY || 'your-secret-key';
      if (!key) {
        throw new Error('Missing encryption key');
      }

      // Mã hóa cả keyword và câu trả lời trước khi gửi về client
      const encryptedMainKeyword = crossword.mainKeyword.map(mk => ({
        keyword: CryptoJS.AES.encrypt(mk.keyword, key).toString(),
        associatedHorizontalKeywords: mk.associatedHorizontalKeywords.map(hw => ({
          questionNumber: hw.questionNumber,
          questionContent: hw.questionContent,
          answer: CryptoJS.AES.encrypt(hw.answer, key).toString(),
          columnPosition: hw.columnPosition,
          numberOfCharacters: hw.answer.length,
          timesPlayed: hw.timesPlayed || 0
        }))
      }));

      // Trả về dữ liệu đã mã hóa
      res.json({
        success: true,
        data: {
          title: crossword.title,
          mainKeyword: encryptedMainKeyword,
          numberOfQuestions: crossword.mainKeyword[0]?.keyword?.length || 0
        }
      });

    } catch (error) {
      console.error('Start play error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi bắt đầu phiên chơi'
      });
    }
  },

  clearPlaySession: async (req, res) => {
    try {
      // Xóa cookie phiên chơi
      res.clearCookie('playSession', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.status(200).json({
        success: true,
        message: 'Đã kết thúc phiên chơi'
      });
    } catch (error) {
      console.error('Clear play session error:', error);
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi kết thúc phiên chơi'
      });
    }
  },

  // Hàm API endpoint GetSecretKey
  GetSecretKey: async (req, res) => {
    try {
      const key = process.env.ANSWER_ENCRYPTION_KEY || 'your-secret-key';
      if (!key) {
        throw new Error('Missing encryption key');
      }

      res.json({
        success: true,
        data: {
          secretKey: key
        }
      });
    } catch (error) {
      console.error('Get secret key error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy secret key'
      });
    }
  },

  deleteCrossword: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      // Tìm và kiểm tra quyền sở hữu
      const crossword = await Crossword.findOne({ _id: id, author: userId });
      
      if (!crossword) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ hoặc bạn không có quyền xóa'
        });
      }

      // Thực hiện xóa
      await Crossword.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Xóa ô chữ thành công'
      });

    } catch (error) {
      console.error('Delete crossword error:', error);
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa ô chữ'
      });
    }
  },

  search: async (req, res) => {
    try {
      const { query, subject, grade, page = 1, limit = 9 } = req.query;
      
      // Xây dựng query object
      const searchQuery = {
        status: 'Công khai' // Chỉ tìm các ô chữ công khai
      };

      // Thêm điều kiện tìm kiếm nếu có
      if (query) {
        searchQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { authorName: { $regex: query, $options: 'i' } }
        ];
      }

      if (subject) {
        searchQuery.subject = subject;
      }

      if (grade) {
        searchQuery.gradeLevel = grade;
      }

      // Tính skip cho phân trang
      const skip = (page - 1) * limit;

      // Thực hiện query với phân trang
      const [crosswords, total] = await Promise.all([
        Crossword.find(searchQuery)
          .select('title subject gradeLevel authorName mainKeyword createdAt timesPlayed')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Crossword.countDocuments(searchQuery)
      ]);

      // Tính toán số trang
      const totalPages = Math.ceil(total / limit);

      // Format lại dữ liệu trước khi trả về
      const formattedCrosswords = crosswords.map(c => ({
        _id: c._id,
        title: c.title,
        subject: c.subject,
        grade: c.gradeLevel,
        author: c.authorName,
        questionCount: c.mainKeyword[0]?.associatedHorizontalKeywords?.length || 0,
        timesPlayed: c.timesPlayed || 0,
        createdAt: c.createdAt
      }));

      return res.json({
        success: true,
        data: {
          crosswords: formattedCrosswords,
          totalPages,
          totalResults: total
        }
      });

    } catch (error) {
      console.error('Search crosswords error:', error);
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tìm kiếm ô chữ'
      });
    }
  }
};

export const getCrossword = async (req, res) => {
  try {
    const crossword = await Crossword.findById(req.params.id);
    if (!crossword) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ô chữ'
      });
    }
    
    res.status(200).json({
      success: true,
      data: crossword
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin ô chữ',
      error: error.message
    });
  }
};
