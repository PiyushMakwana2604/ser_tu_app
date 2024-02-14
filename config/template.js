exports.send_otp = async (result) => {
  // console.log("otptotptoto", result)
  const template = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>OTP</title>
    </head>
    <body>
        <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
              <div style="margin:50px auto;width:70%;padding:20px 0">
                <div style="border-bottom:1px solid #eee">
                      <img src="https://content.app-us1.com/728XB/2022/01/20/6a690c9c-b23e-43db-bd65-6a8d5333d52f.jpeg" style="width: 80px;">
                </div>
                <p style="font-size:1.1em">Hi,</p>
                <p>Thank you for choosing <b>${process.env.APP_NAME}</b>. Use the following OTP to complete your Sign Up procedures. OTP is valid for <b>5 minutes</b>.</p>
                <h2 style="background: #8ec63f;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${result.OTP}</h2>
                <p style="font-size:0.9em;">Regards,<br /><b>${process.env.APP_NAME}</b></p>
                <hr style="border:none;border-top:1px solid #eee" />
              </div>
        </div>
    </body>
    </html>`;
  return template;
}