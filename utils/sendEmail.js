// Import nodemailer
import nodemailer from "nodemailer";

// Create the sendEmail function
const sendEmail = async ({to, subject, text}) => {
  // Create a transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use other services like 'yahoo', 'hotmail', etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
  });

  // Set up email data with unicode symbols
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: to, // List of receivers
    subject: subject, // Subject line
    text: text, // Plain text body
  };

  // Send mail with defined transport object
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    
    console.error("Error sending email: ", error);
    return `Not able to send Mail ${error.message}`
  }
};

// Export the sendEmail function
export default sendEmail;
