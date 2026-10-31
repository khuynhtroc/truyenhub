import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface GA4ReportRow {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

interface GA4RunReportResponse {
  rows?: GA4ReportRow[];
  rowCount?: number;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Get Google OAuth2 access token from Service Account
 */
async function getGoogleAccessToken(): Promise<string> {
  let sa: any = null;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (_) {}
  }

  if (!sa) {
    const saPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "doctruyenvip-sa.json";
    const resolvedPath = path.isAbsolute(saPath) ? saPath : path.join(/*turbopackIgnore: true*/ process.cwd(), saPath);

    if (fs.existsSync(resolvedPath)) {
      sa = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    }
  }

  if (!sa || !sa.client_email || !sa.private_key) {
    throw new Error("Không tìm thấy cấu hình Service Account Google (GOOGLE_SERVICE_ACCOUNT_JSON hoặc doctruyenvip-sa.json)");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const b64 = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsignedToken = `${b64(header)}.${b64(claimSet)}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  const signature = sign.sign(sa.private_key, "base64url");
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Lỗi lấy access_token Google OAuth2");
  }

  return data.access_token;
}

/**
 * Fetch actual pageviews from GA4 Data API for stories
 */
export async function fetchGA4StoryViews(propertyId: string): Promise<Record<string, number>> {
  if (!propertyId) {
    throw new Error("Chưa cấu hình GA4 Property ID");
  }

  const cleanPropertyId = propertyId.replace(/^properties\//, "").trim();
  const token = await getGoogleAccessToken();

  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}:runReport`;

  const requestBody = {
    dateRanges: [
      {
        startDate: "2024-01-01",
        endDate: "today",
      },
    ],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    dimensionFilter: {
      filter: {
        fieldName: "pagePath",
        stringFilter: {
          matchType: "CONTAINS",
          value: "/truyen/",
        },
      },
    },
    limit: "10000",
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data: GA4RunReportResponse = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Lỗi truy vấn GA4 Data API (code ${data.error?.code || response.status})`);
  }

  const viewsBySlug: Record<string, number> = {};

  if (data.rows && Array.isArray(data.rows)) {
    for (const row of data.rows) {
      const pathVal = row.dimensionValues?.[0]?.value || "";
      const views = parseInt(row.metricValues?.[0]?.value || "0", 10);

      // Matches: /truyen/slug or /truyen/slug/chuong-1
      const match = pathVal.match(/\/truyen\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const slug = match[1];
        viewsBySlug[slug] = (viewsBySlug[slug] || 0) + views;
      }
    }
  }

  return viewsBySlug;
}

/**
 * Synchronize GA4 views & reading history views to Supabase stories
 */
export async function syncRealViewsToDatabase(customPropertyId?: string) {
  const supabase = createAdminSupabaseClient();

  // 1. Resolve GA4 Property ID from args, settings, or env
  let propertyId = customPropertyId || process.env.GA4_PROPERTY_ID || "";
  if (!propertyId) {
    const { data: siteRow } = await supabase.from("settings").select("value").eq("key", "site").single();
    if (siteRow?.value?.ga4_property_id) {
      propertyId = siteRow.value.ga4_property_id;
    }
  }

  const results = {
    ga4Fetched: false,
    ga4ViewsCount: 0,
    historySyncedCount: 0,
    updatedStories: [] as Array<{ id: string; title: string; slug: string; oldViews: number; newViews: number }>,
    error: null as string | null,
  };

  // 2. Fetch from GA4 if propertyId configured
  let ga4Views: Record<string, number> = {};
  if (propertyId) {
    try {
      ga4Views = await fetchGA4StoryViews(propertyId);
      results.ga4Fetched = true;
      results.ga4ViewsCount = Object.keys(ga4Views).length;
    } catch (err: any) {
      console.warn("GA4 fetch error (continuing with database history):", err.message);
      results.error = err.message;
    }
  }

  // 3. Aggregate internal reading_history reads
  const { data: historyRows } = await supabase.from("reading_history").select("story_id");
  const readsByStoryId: Record<string, number> = {};
  if (historyRows) {
    for (const h of historyRows) {
      if (h.story_id) {
        readsByStoryId[h.story_id] = (readsByStoryId[h.story_id] || 0) + 1;
      }
    }
  }
  results.historySyncedCount = Object.keys(readsByStoryId).length;

  // 4. Update stories with actual combined views
  // For each story, real views = max(ga4 views, internal reads count, current views)
  const { data: stories } = await supabase
    .from("stories")
    .select("id, title, slug, total_views")
    .neq("status", "trash");

  if (stories) {
    for (const s of stories) {
      const gaView = ga4Views[s.slug] || 0;
      const historyRead = readsByStoryId[s.id] || 0;
      const currentView = s.total_views || 0;

      // The real count is GA4 views + internal reads, or at least max of them
      const calculatedReal = Math.max(gaView, historyRead);

      // If calculatedReal > currentView or if currentView was a fake 1500
      if (calculatedReal !== currentView && (calculatedReal > 0 || currentView === 1500)) {
        const finalViews = calculatedReal;
        await supabase.from("stories").update({ total_views: finalViews }).eq("id", s.id);
        results.updatedStories.push({
          id: s.id,
          title: s.title,
          slug: s.slug,
          oldViews: currentView,
          newViews: finalViews,
        });
      }
    }
  }

  return results;
}
