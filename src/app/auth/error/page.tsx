"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    Default: "An error occurred during authentication.",
  };

  const message = errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="font-fredoka text-2xl font-semibold mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="btn-primary inline-block w-full"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 text-sm block"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
              </div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}