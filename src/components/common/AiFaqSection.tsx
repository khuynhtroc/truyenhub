'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown, BookOpen } from 'lucide-react';
import { MASTER_DOCTRUYEN_FAQS, StoryFaqItem } from '@/lib/ai-seo-faq';

interface AiFaqSectionProps {
  faqs?: StoryFaqItem[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function AiFaqSection({
  faqs = MASTER_DOCTRUYEN_FAQS,
  title = 'Câu Hỏi Thường Gặp Khi Đọc Truyện Tại DocTruyen.vip',
  subtitle = 'Giải đáp nhanh về kho truyện tranh 4K Full HD, tiểu thuyết truyện chữ, tính năng giọng đọc AI tự nhiên và cách nhận Xu thưởng miễn phí mỗi ngày.',
  compact = false
}: AiFaqSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="hoi-dap-doctruyen-vip"
      className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs mt-2"
      aria-labelledby="doctruyen-faq-heading"
    >
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1.5 text-rose-500 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Thông Tin Tổng Quan &amp; Hỏi Đáp Nhanh</span>
        </div>
        <h2 id="doctruyen-faq-heading" className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{title}</span>
        </h2>
        {subtitle && <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {faqs.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
              className={`rounded-xl border transition ${
                isOpen
                  ? 'bg-muted/50 border-rose-500/40'
                  : 'bg-background/60 border-border/50 hover:border-rose-500/30'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="w-full text-left p-3.5 flex items-start justify-between gap-2.5"
              >
                <h3 itemProp="name" className="font-bold text-xs sm:text-sm text-foreground leading-snug">
                  {idx + 1}. {item.question}
                </h3>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform ${
                    isOpen ? 'rotate-180 text-rose-500' : ''
                  }`}
                />
              </button>
              <div
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
                className={`px-3.5 pb-3.5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40 ${
                  isOpen ? 'block' : 'hidden print:block'
                }`}
              >
                <div itemProp="text" className="pt-2.5">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

