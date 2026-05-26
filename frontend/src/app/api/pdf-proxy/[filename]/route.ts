import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  // Use backend URL from environment variables, default to local docker/compose backend service or localhost
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  
  try {
    const res = await fetch(`${backendUrl}/documents/${encodeURIComponent(filename)}/pdf`);
    if (!res.ok) {
      return new NextResponse("PDF not found", { status: res.status });
    }
    
    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
