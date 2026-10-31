import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "BAA6EIGdgu5WedBFATYzhfFcz1WJ1aTBe1hklE9C3KN3_9Z0-FIUSQKKRSa9DrcbuvnYXeG4zK64OnfUWw";
const PAYPAL_SECRET =
  process.env.PAYPAL_CLIENT_SECRET ||
  "ENBP1A6XDBXIUO12AID_JWh4yFif-FU9ADbHZIr5NaFkJfuGJbAUd3lyPwUrMR5CN6p1anGNGQG1Z8ZP";
const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Không thể xác thực với PayPal.");
  }
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountUsd, coins, userId, vipPackageTitle, description } = body;

    const numAmount = Number(amountUsd || 0);
    if (numAmount <= 0) {
      return NextResponse.json({ success: false, error: "Số tiền USD không hợp lệ" }, { status: 400 });
    }

    let accessToken: string;
    try {
      accessToken = await getPayPalAccessToken();
    } catch (authErr: any) {
      console.warn("PayPal Auth Warning:", authErr.message);
      return NextResponse.json(
        {
          success: false,
          error: `Tài khoản PayPal đang chờ xác thực kích hoạt từ PayPal Edge: ${authErr.message}.`,
          isPendingReview: true,
        },
        { status: 500 }
      );
    }

    const orderDescription =
      description ||
      (vipPackageTitle
        ? `Nang cap VIP: ${vipPackageTitle} - DocTruyen.vip`
        : `Nap ${coins || 100} Xu - DocTruyen.vip`);

    // Tạo Order v2 trên PayPal
    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `USER_${userId || "guest"}_${Date.now()}`,
            description: orderDescription,
            amount: {
              currency_code: "USD",
              value: numAmount.toFixed(2),
            },
          },
        ],
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.id) {
      return NextResponse.json(
        { success: false, error: orderData.message || "Lỗi tạo đơn hàng PayPal" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      links: orderData.links,
    });
  } catch (error: any) {
    console.error("PayPal Create Order error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
