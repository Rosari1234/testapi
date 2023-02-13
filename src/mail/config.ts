require("dotenv").config();
import { DDeal } from "../models/deal-model";
import { DUser } from "../models/user-model";
var nodemailer = require("nodemailer");
var nodemailerSendgrid = require("nodemailer-sendgrid");
var jwt = require("jsonwebtoken");
var fs = require("fs");

export namespace EmailService {
  const emailHeader = `<!DOCTYPE html> <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width,initial-scale=1"> <meta name="x-apple-disable-message-reformatting"> <title></title> <!--[if mso]> <noscript> <xml> <o:OfficeDocumentSettings> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript> <![endif]--> <style> table, td, div, h1, p {font-family: Arial, sans-serif;} </style> </head> <body style="margin:0;padding:0;"> <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;"> <tr> <td align="center" style="padding:0;"> <table role="presentation" style="width:602px;border-collapse:collapse;border:1px solid #cccccc;border-spacing:0;text-align:left;"> <tr> <td align="center" style="padding:40px 0 10px 0;background:#fff;"><img src="https://pencilmydeal.efito.xyz/static/assets/img/logo_original.png" alt="" width="300" style="height:auto;display:block;" />  </td> </tr>`;
  const emailFooter = `<tr> <td style="padding:30px;background:#5D5AF2;"> <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;font-size:9px;font-family:Arial,sans-serif;"> <tr> <td style="padding:0;width:50%;" align="left"> <p style="margin:0;font-size:14px;line-height:16px;font-family:Arial,sans-serif;color:#ffffff;"> &copy; 2022 Pencil My Deal<br/> </td> <td style="padding:0 0 0 10px;width:38px;">  </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </body> </html>`;

  const transport = nodemailer.createTransport(
    nodemailerSendgrid({
      apiKey: process.env.SENDGRID_KEY,
    })
  );

  export async function sendVerifyEmail(
    user: DUser,
    subject: string,
    verificationCode: string,
    bodyText1: string,
    bodyText2: string
  ) {
    console.log(user.email)
    console.log(process.env.SENGRID_SENDER)
    try {
      transport.sendMail({
        from: process.env.SENGRID_SENDER,
        to: `${user.email}`,
        subject: subject,
        html:
          emailHeader +
          `<tr>
          <td style="padding:36px 30px 42px 30px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
              <tr>
                <td style="padding:0 0 36px 0;color:#153643;">
                  <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">${bodyText1}</h1>
                  <p style="margin:0 0 0px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">${bodyText2}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <div style="width: 100%; background: #efefef; font-family: Lucida Grande,Lucida Sans Unicode,Lucida Sans,Geneva,Verdana,sans-serif; font-weight: bold; text-align: center; padding: 50px 0px;">
                    <span style="color: #153643; font-size:20px;">${verificationCode}</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>` +
          emailFooter,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  export async function sendForgetPasswordEmail(user: DUser, subject: string) {
    const token = await jwt.sign(
      {
        _id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET
    );

    const url = `${process.env.APP_URL}/recover_password?token=${token}`;

    try {
      transport.sendMail({
        from: process.env.SENGRID_SENDER,
        to: `${user.email}`,
        subject: subject,
        html:
          emailHeader +
          `<tr>
          <td style="padding:36px 30px 42px 30px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
              <tr>
                <td style="padding:0 0 36px 0;color:#153643;">
                  <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">Pencil My Deal - Reset Password!</h1>
                  <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">
                    Did you request to change your password? If so click here.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <div style="width: 100%; background: #efefef; font-family: Lucida Grande,Lucida Sans Unicode,Lucida Sans,Geneva,Verdana,sans-serif; font-weight: bold; text-align: center; padding: 50px 0px;">                      
                    <a href="${url}" style="width: 50px; padding:10px; background: #fff; border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px; text-decoration: none;">
                      <span style="color: #FF8000; font-size:20px;"> Click Here</span>
                    </a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>` +
          emailFooter,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  export async function sendWelcomeEmail(user: DUser, subject: string) {
    try {
      transport.sendMail({
        from: process.env.SENGRID_SENDER,
        to: `${user.email}`,
        subject: subject,
        html:
          emailHeader +
          `<tr>
          <td style="padding:36px 30px 42px 30px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
              <tr>
                <td style="padding:0 0 36px 0;color:#153643;">
                  <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">Welcome To Pencil My Deal</h1>
                  <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">
                    <br/><br/>
                  </p>
                  <p style="margin:0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">
                    </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  Welcome to Pencilmydeal!
                </td>
              </tr>
            </table>
          </td>
        </tr>` +
          emailFooter,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  export async function sendCreateDealEmail(user: DUser, subject: string) {
    try {
      transport.sendMail({
        from: process.env.SENGRID_SENDER,
        to: `${user.email}`,
        subject: subject,
        html:
          emailHeader +
          `<tr>
          <td style="padding:36px 30px 42px 30px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
              <tr>
                <td style="padding:0 0 36px 0;color:#153643;">
                  <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">Create Deal</h1>
                  <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">
                    <br/><br/>
                  </p>
                  <p style="margin:0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">
                    </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  New deal has been created successfully.
                </td>
              </tr>
            </table>
          </td>
        </tr>` +
          emailFooter,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  export async function sendSubscriptionEmail(
    user: DUser,
    subject: string,
    bodyText1?: string,
    otherUserName?: string
  ) {
    try {
      transport.sendMail({
        from: process.env.SENGRID_SENDER,
        to: `${user.email}`,
        subject: subject,
        html:
          emailHeader +
          `<tr>
          <td style="padding:36px 30px 42px 30px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
              <tr>
                <td style="padding:0 0 36px 0;color:#153643;">
                  <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">${bodyText1} ${otherUserName != null && otherUserName
          }</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <div style="width: 100%; background: #efefef; font-family: Lucida Grande,Lucida Sans Unicode,Lucida Sans,Geneva,Verdana,sans-serif; font-weight: bold; text-align: center; padding: 50px 0px;">                      
                    <a href="${process.env.APP_URL
          }" style="width: 50px; padding:10px; background: #fff; border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px; text-decoration: none;">
                      <span style="color: #FF8000; font-size:20px;">Visit Pencil My Deal</span>
                    </a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>` +
          emailFooter,
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}