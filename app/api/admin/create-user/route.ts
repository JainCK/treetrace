// src/app/api/admin/create-user/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, roleName } = await request.json();

    // Get the current user's session token from the incoming request's headers
    // This token will be passed to the Edge Function to authenticate the admin
    const authHeader = request.headers.get("Authorization");

    // Forward the request to your Supabase Edge Function
    // IMPORTANT: Replace <YOUR_PROJECT_REF> with your actual Supabase project ID!
    const edgeFunctionUrl = `https://hvsiqynmuomnmpzeivxs.supabase.co/functions/v1/create-user-by-admin-`;

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || "", // Pass the authorization header from the client
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Supabase functions require anon key for invocation
      },
      body: JSON.stringify({ email, password, roleName }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Pass through the error message and status from the Edge Function
      return NextResponse.json(
        { error: data.error || "Failed to create user via Edge Function" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error in Next.js create-user API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
