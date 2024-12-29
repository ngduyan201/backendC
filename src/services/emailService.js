import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendResetEmail = async (email, code) => {
  try {
    const mailOptions = {
      from: '"Ô Chữ Việt Nam" <no-reply@ochuvietnam.com>',
      to: email,
      subject: '[Ô Chữ Việt Nam] Yêu cầu đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2c5282; margin: 0;">Ô Chữ Việt Nam</h1>
            <p style="color: #718096; font-size: 16px;">Yêu cầu đặt lại mật khẩu</p>
          </div>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; color: #4a5568; font-size: 15px;">Xin chào,</p>
            <p style="color: #4a5568; font-size: 15px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Đây là mã xác thực của bạn:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <div style="background-color: #ffffff; display: inline-block; padding: 15px 30px; border-radius: 5px; border: 2px dashed #3182ce;">
                <span style="font-size: 24px; font-weight: bold; color: #2c5282; letter-spacing: 3px;">${code}</span>
              </div>
            </div>
            
            <p style="color: #e53e3e; font-size: 14px; text-align: center;">Mã này sẽ hết hạn sau 5 phút.</p>
          </div>
          
          <div style="color: #718096; font-size: 14px; text-align: center;">
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="margin: 0;">© 2024 Ô Chữ Việt Nam. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;

  } catch (error) {
    console.error('Send email error:', error);
    throw new Error('Không thể gửi email xác thực');
  }
};
