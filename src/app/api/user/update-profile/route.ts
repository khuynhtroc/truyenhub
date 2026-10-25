import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, displayName, avatarUrl, avatarBase64, mimeType, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID người dùng." },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    let finalAvatarUrl = avatarUrl;

    // Handle base64 image upload if provided
    if (avatarBase64) {
      try {
        const matches = avatarBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;
        let ext = "webp";

        if (matches && matches.length === 3) {
          const mime = matches[1];
          if (mime.includes("png")) ext = "png";
          else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
          else if (mime.includes("gif")) ext = "gif";
          buffer = Buffer.from(matches[2], "base64");
        } else {
          buffer = Buffer.from(avatarBase64, "base64");
        }

        const fileName = `user_${userId}_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, buffer, {
            contentType: mimeType || `image/${ext}`,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);
          finalAvatarUrl = publicData.publicUrl;
        } else {
          console.error("Lỗi upload avatar:", uploadError);
        }
      } catch (err) {
        console.error("Lỗi xử lý ảnh base64 avatar:", err);
      }
    }

    // Build update payload for profiles table
    const profileUpdate: any = {
      updated_at: new Date().toISOString(),
    };

    if (displayName !== undefined && displayName !== null) {
      profileUpdate.display_name = String(displayName).trim();
    }
    if (finalAvatarUrl !== undefined && finalAvatarUrl !== null) {
      profileUpdate.avatar_url = finalAvatarUrl;
    }

    const { data: updatedProfile, error: profileErr } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId)
      .select()
      .single();

    if (profileErr) {
      console.error("Profile update error:", profileErr);
    }

    // Also update auth.users metadata for consistency
    try {
      const authMetadataUpdate: any = {};
      if (profileUpdate.display_name) {
        authMetadataUpdate.display_name = profileUpdate.display_name;
        authMetadataUpdate.full_name = profileUpdate.display_name;
      }
      if (finalAvatarUrl) {
        authMetadataUpdate.avatar_url = finalAvatarUrl;
      }
      if (preferences) {
        authMetadataUpdate.preferences = preferences;
      }

      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: authMetadataUpdate,
      });
    } catch (authErr) {
      console.warn("Auth user metadata update warn:", authErr);
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      avatarUrl: finalAvatarUrl,
      message: "Cập nhật thông tin cá nhân thành công!",
    });
  } catch (error: any) {
    console.error("update-profile error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật hồ sơ" },
      { status: 500 }
    );
  }
}
