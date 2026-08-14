import twilio from "twilio";

// get the env variables fro twilio client
const SID = Bun.env.TWILIO_ACCOUNT_SID;
const apiKey = Bun.env.TWILIO_API_KEY;
const apiSecret = Bun.env.TWILIO_API_SECRET;

// create the client using env var's
export const twilioClient = twilio(apiKey, apiSecret, { accountSid: SID });

// exporting the twilio given phone number
export const twilioPhone = Bun.env.TWILIO_PHONE;
