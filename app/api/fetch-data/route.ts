import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Shipment ID is required" },
        { status: 400 }
      );
    }

    const accessToken = req.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Unauthorized - No access token" },
        { status: 401 }
      );
    }

    const skylinkUrl = process.env.SKYLINK_URL;
    const authHeader = `Bearer ${accessToken}`;

    // Fetch both endpoints in parallel
    const [shipmentRes, evidencesRes] = await Promise.all([
      fetch(`${skylinkUrl}/api/v1/shipments/${id}`, {
        headers: {
          Authorization: authHeader,
          accept: "*/*",
        },
      }),
      fetch(`${skylinkUrl}/api/v1/evidences?shipment_id=${id}`, {
        headers: {
          Authorization: authHeader,
          accept: "*/*",
        },
      }),
    ]);

    if (!shipmentRes.ok) {
      return NextResponse.json(
        { message: "Failed to fetch shipment data" },
        { status: shipmentRes.status }
      );
    }

    if (!evidencesRes.ok) {
      return NextResponse.json(
        { message: "Failed to fetch evidences data" },
        { status: evidencesRes.status }
      );
    }

    const shipmentData = await shipmentRes.json();
    const evidencesData = await evidencesRes.json();

    return NextResponse.json({
      shipment: shipmentData,
      evidences: evidencesData,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
