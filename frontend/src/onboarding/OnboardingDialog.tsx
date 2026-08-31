import { useEffect, useState } from "react";
import { Bell, ChevronRight, Download, GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isIos } from "@/lib/platform";

const STORAGE_KEY = "tutorops.onboarding_done";

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    setOpen(true);
  }, []);

  function finish() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  function next() {
    if (step >= SLIDES.length - 1) {
      finish();
    } else {
      setStep(step + 1);
    }
  }

  const slide = SLIDES[step];

  return (
    <Dialog open={open} onOpenChange={(value) => value && finish()}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader>
          <span className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-primary">
            <slide.icon size={24} aria-hidden="true" />
          </span>
          <DialogTitle className="pt-2 text-lg font-bold">
            {slide.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5 text-sm text-slate-600">
          {slide.body.map((line) => (
            <p key={line} className="leading-relaxed">
              {line}
            </p>
          ))}
          {slide.steps && (
            <ol className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3">
              {slide.steps.map((item, index) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="mt-4 flex min-h-11 items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {SLIDES.map((item, index) => (
              <span
                key={item.title}
                className={[
                  "size-2 rounded-full transition-colors",
                  index === step ? "bg-primary" : "bg-slate-200",
                ].join(" ")}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 text-slate-500"
              onClick={finish}
            >
              Bỏ qua
            </Button>
            <Button type="button" className="min-h-11" onClick={next}>
              {step >= SLIDES.length - 1 ? "Bắt đầu" : "Tiếp"}
              {step < SLIDES.length - 1 && (
                <ChevronRight size={16} aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Slide = {
  icon: typeof GraduationCap;
  title: string;
  body: string[];
  steps?: string[];
};

const SLIDES: Slide[] = [
  {
    icon: GraduationCap,
    title: "Chào mừng đến TutorOps",
    body: [
      "Trợ lý cho gia sư: quản lý học sinh, ghi nhận buổi dạy, giao bài tập và theo dõi học phí ở một nơi.",
    ],
  },
  {
    icon: Download,
    title: "Cài app vào màn hình chính",
    body: [
      "Cài TutorOps như một ứng dụng để mở nhanh và dùng thoải mái trên điện thoại.",
    ],
    steps: isIos()
      ? [
          "Mở trang này bằng trình duyệt Safari",
          "Nhấn nút Chia sẻ (hình vuông có mũi tên)",
          "Chọn “Thêm vào Màn hình chính”",
          "Mở app từ icon vừa tạo",
        ]
      : [
          "Mở menu trình duyệt (biểu tượng ba chấm)",
          "Chọn “Cài đặt ứng dụng” hoặc “Thêm vào Màn hình chính”",
        ],
  },
  {
    icon: Bell,
    title: "Nhận thông báo",
    body: [
      "Bật thông báo để biết ngay khi học sinh nộp bài.",
      isIos()
        ? "Trên iPhone, thông báo chỉ hoạt động sau khi đã cài app vào Màn hình chính."
        : "Bật thông báo trong mục Cài đặt bất cứ lúc nào.",
    ],
  },
];
