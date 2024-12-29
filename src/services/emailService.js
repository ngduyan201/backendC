import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  // Config SMTP
});

export const sendResetEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Đặt lại mật khẩu - Trò Chơi Ô Chữ',
    html: `
      <h1>Yêu cầu đặt lại mật khẩu</h1>
      <p>Mã xác thực của bạn là: <strong>${code}</strong></p>
      <p>Mã này sẽ hết hạn sau 15 phút.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
