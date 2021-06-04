const mail = require('@sendgrid/mail');

class Mail {
  constructor(_mail) {
    this._mail = _mail;
    this._mail.setApiKey(process.env.MAIL_API_KEY);
    this._from = process.env.MAIL_FROM;
    this.sendResetPasswordMail = this.sendResetPasswordMail.bind(this);
  }

  async sendResetPasswordMail(email, uri) {
    const msg = {
      from: this._from,
      to: email,
      subject: `password reset request`,
      html: `<!DOCTYPE html>
            <html lang="en">
                <head>
                <meta charset="UTF-8" />
                <title>password reset request</title>
                </head>
                <body
                style="background-color: rgb(0, 0, 0); color: rgb(75, 73, 73); padding: 40px 20px;">
                <main>
                    <h1>Hello there,</h1>
                    <p>A request has been received to change the password.</p>
                    <a href="${uri}" style="
                        background-color: rgb(255, 255, 255);
                        color: rgb(75, 73, 73);
                        margin: 40px 0px;
                        padding: 4px 8px;
                        text-align: center;">Reset Password</a>
                    <p>If you did not initiate this request, please contact us immediately at
                    support@thelocalstore.com.</p>
                    <p>Thank you,</p>
                    <p>The Local Store Team</p>
                </main>
                </body>
            </html>`,
    };
    await this._mail.send(msg);
    return true;
  }
}

module.exports = new Mail(mail);
