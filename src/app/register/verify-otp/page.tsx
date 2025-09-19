"use client";

import { Suspense } from "react";
import VerifyOtpClient from "./verify-otp-client";

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyOtpClient />
        </Suspense>
    );
}
