import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STORAGE_KEY = 'imas_pricing_popup_dismissed_until';
const BASE = import.meta.env.BASE_URL;

export default function PricingPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const dismissedUntil = localStorage.getItem(STORAGE_KEY);
      const now = new Date();
      if (!dismissedUntil || new Date(dismissedUntil) <= now) {
        // 약간 지연 후 표시 (페이지 로드 끝난 후 자연스럽게)
        const timer = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage 사용 불가 환경에서는 그냥 표시
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const handleClose = () => setOpen(false);

  const handleDontShowToday = () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      localStorage.setItem(STORAGE_KEY, tomorrow.toISOString());
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-popup-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-background border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <Badge variant="outline" className="mb-3 border-[#4a9eff]/40 bg-[#4a9eff]/10 text-[#4a9eff]">
            가격 안내
          </Badge>
          <h2 id="pricing-popup-title" className="text-2xl md:text-3xl font-extrabold tracking-tight">
            IMAS 라이선스 가격
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            합리적인 가격으로 모든 기능을 사용하세요
          </p>
        </div>

        {/* Pricing cards */}
        <div className="px-8 pb-4 grid gap-4 sm:grid-cols-2">
          {/* Personal */}
          <div className="rounded-xl border border-border/60 p-5 bg-background">
            <div className="text-xs font-medium text-muted-foreground mb-2">개인</div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-extrabold">20<span className="text-base font-bold">만원</span></span>
              <span className="text-sm text-muted-foreground">/ 년</span>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#4a9eff]">✓</span>
                <span>컴퓨터 <strong className="text-foreground">1대</strong> 사용</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4a9eff]">✓</span>
                <span>모든 평가 기능</span>
              </li>
            </ul>
          </div>

          {/* Corporate */}
          <div className="rounded-xl border-2 border-[#4a9eff]/60 p-5 bg-[#4a9eff]/5 relative">
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[#4a9eff] text-white text-xs font-semibold">
              추천
            </div>
            <div className="text-xs font-medium text-[#4a9eff] mb-2">기업</div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-extrabold">100<span className="text-base font-bold">만원</span></span>
              <span className="text-sm text-muted-foreground">/ 년</span>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#4a9eff]">✓</span>
                <span>컴퓨터 <strong className="text-foreground">무제한</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4a9eff]">✓</span>
                <span>기업명으로 발급</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
          <a href={`${BASE}pricing/`} className="flex-1">
            <Button className="w-full h-11 font-semibold bg-[#4a9eff] hover:bg-[#3a8eef] text-white">
              자세히 보기
            </Button>
          </a>
          <Button
            variant="outline"
            className="h-11 font-medium"
            onClick={handleDontShowToday}
          >
            오늘 그만 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
