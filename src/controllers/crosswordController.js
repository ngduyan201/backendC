import Crossword from '../models/Crossword.js';

export const createCrossword = async (req, res) => {
  try {
    console.log('Creating crossword with data:', req.body);
    const { title, status, gradeLevel, subject } = req.body;
    
    // Validate dữ liệu đầu vào
    if (!title || !status || !gradeLevel || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: tên ô chữ, trạng thái, cấp lớp và môn học'
      });
    }

    // Tạo ô chữ mới với đầy đủ thông tin
    const crossword = new Crossword({
      title,                // Tên ô chữ
      status,              // Trạng thái (Chia sẻ/Không chia sẻ)
      gradeLevel,          // Cấp lớp
      subject,             // Môn học
      author: req.user._id, // ID tác giả từ middleware auth
      timesPlayed: 0,      // Số lần chơi, mặc định là 0
      mainKeyword: []      // Từ khóa chính, khởi tạo rỗng
    });

    await crossword.save();
    console.log('Crossword created successfully:', crossword);

    res.status(201).json({
      success: true,
      message: 'Tạo ô chữ thành công',
      data: crossword
    });
    
  } catch (error) {
    console.error('Error creating crossword:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo ô chữ',
      error: error.message
    });
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
