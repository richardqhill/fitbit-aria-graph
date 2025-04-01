'use client';

import { signIn, signOut, useSession } from "next-auth/react";

export default function Login() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <div>
          <button 
            onClick={() => signOut()}
            style={{
              padding: "8px 16px",
              border: "2px solid #6c757d",
              borderRadius: 8,
              color: "#d1d5db",
            }}>
              Logout
          </button>
        </div>
      ) : (
        <button 
          onClick={() => signIn("fitbit")}
          style={{
            padding: "8px 16px",
            border: "2px solid #6c757d",
            borderRadius: 8,
            backgroundColor: "#4c6e85",
            color: "#d1d5db",
          }}>
            Login with Fitbit
        </button>
      )}
    </div>
  );
}