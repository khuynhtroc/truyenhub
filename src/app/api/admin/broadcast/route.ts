import { NextRequest, NextResponse } from "next/server";
import {
  broadcastNewStory,
  broadcastNewChapter,
  broadcastRankings,
  broadcastPromotions,
  sendTelegramMessage,
} from "@/lib/telegram-broadcast";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, story, chapter, customMessage, rankingsLimit } = body;

    let result;

    switch (action) {
      case "rankings":
        result = await broadcastRankings(rankingsLimit || 5);
        break;

      case "promotions":
        result = await broadcastPromotions();
        break;

      case "new_story":
        if (!story || !story.title || !story.slug) {
          return NextResponse.json({ success: false, error: "Thiếu thông tin story (title, slug)" }, { status: 400 });
        }
        result = await broadcastNewStory(story);
        break;

      case "new_chapter":
        if (!chapter || !chapter.storyTitle || !chapter.storySlug || !chapter.chapterNumber) {
          return NextResponse.json({ success: false, error: "Thiếu thông tin chapter" }, { status: 400 });
        }
        result = await broadcastNewChapter(chapter);
        break;

      case "custom":
        if (!customMessage) {
          return NextResponse.json({ success: false, error: "Thiếu nội dung customMessage" }, { status: 400 });
        }
        result = await sendTelegramMessage(customMessage);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Hành động '${action}' không hợp lệ. Cho phép: rankings, promotions, new_story, new_chapter, custom` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Đã phát sóng '${action}' đến nhóm Telegram thành công!`,
      result,
    });
  } catch (error: any) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
