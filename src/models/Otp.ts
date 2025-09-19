import { Schema, model, models, Document } from "mongoose";

export interface IOtp extends Document {
    email: string;
    code: string;
    expiresAt: Date;
}

const otpSchema = new Schema<IOtp>(
    {
        email: { type: String, required: true },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);


// Use existing model if it exists, otherwise create a new one
const Otp = models.Otp || model<IOtp>("Otp", otpSchema);

export default Otp;
