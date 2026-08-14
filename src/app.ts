import express, { type Request, type Response } from "express";
import { redis } from "./db/connect";
import { twilioClient, twilioPhone } from "./config/twilio";

export const app = express();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running 🚀");
});

// helper function to generate the random otp number
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// api for sending the otp to phone number
app.post("/otp/send", async (req: Request, res: Response) => {
  // get the phone number from body
  const { phone } = req.body;
  // check if the phone number does not exists then return the error
  if (!phone) {
    return res
      .status(404)
      .json({ message: "Please enter a valid phone number" });
  }
  //   set the cooldown timer for otp
  const coolDown = await redis.set(
    `otp:cooldown:${phone}`,
    "1",
    "EX",
    60,
    "NX",
  );
  // then check if the cooldown still valid then return an error to wait untill it expires
  if (!coolDown) {
    return res.status(429).json({ message: "Please wait to get new OTP!" });
  }
  // generate the otp
  const OTP = generateOTP();
  // set the otp to the redis
  await redis.set(`otp:${phone}`, OTP, "EX", 300);
  // send the otp via msg (in console for now)
  // console.log(`OTP for ${phone}: ${OTP}`);

  // now send the otp with message using twilio
  const message = `${OTP} is your OTP for verification. Valid for 5 minutes only. Never share this code with anyone`;

  // call the twilio to send the message
  await twilioClient.messages.create({
    body: message,
    from: twilioPhone,
    to: phone,
  });

  // return the reponse
  res.status(200).json({ message: "OTP sent successfully" });
});

// now verify the otp with orginally generated one
app.post("/otp/verify", async (req: Request, res: Response) => {
  // get the phone and otp from body
  const { phone, otp } = req.body;
  // check if the phone and otp exists or not
  if (!phone || !otp) {
    return res
      .status(400)
      .json({ message: "Otp and phone number is required" });
  }
  // add a count for otp attempts
  const attempts = await redis.incr(`otp:attempts:${phone}`);
  // check if the attempts exceed the limit of 5 then return an error
  if (attempts > 5) {
    return res
      .status(429)
      .json({ message: "Too many requests! Request a new OTP." });
  }
  // now get the stored otp from redis
  const storedOTP = await redis.get(`otp:${phone}`);
  // check if stroed otp exists or not, if not the nreturn an error
  if (!storedOTP) {
    return res.status(400).json({ message: "OTP Expirted!" });
  }
  // check if the stored otp is not equal to given otp, then return an error
  if (storedOTP !== otp) {
    return res
      .status(400)
      .json({ message: "Incorrect OTP. Generate new OTP!" });
  }

  //   after verification delete both otp and attempts
  await redis.del(`otp:${phone}`);
  await redis.del(`otp:attempts:${phone}`);

  //   return the response
  res.status(200).json({ message: "Verified!" });
});
