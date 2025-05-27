const generateotp = () => Math.floor(100000 + Math.random() * 900000);
// console.log("OTP generated: ", generateotp());
export default generateotp;

