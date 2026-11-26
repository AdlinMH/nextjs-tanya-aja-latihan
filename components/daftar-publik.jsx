import { MessageCircleQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatTanggal } from "@/lib/tanggal";

// Daftar pertanyaan yang sudah dijawab dan dipublikasikan pemilik.
// Teks ditampilkan sebagai teks biasa (React otomatis mengamankan HTML).
export function DaftarPublik({ pertanyaan }) {
  if (pertanyaan.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-6 py-10 text-center">
        <MessageCircleQuestion className="mx-auto mb-3 size-10 text-primary" aria-hidden="true" />
        <p className="font-semibold">Belum ada jawaban.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Jadilah yang pertama bertanya!
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {pertanyaan.map((item) => (
        <li key={item.id}>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="whitespace-pre-wrap break-words text-base font-semibold">
                {item.question}
              </p>
              <div className="rounded-lg border-l-4 border-primary bg-secondary px-4 py-3">
                <p className="whitespace-pre-wrap break-words text-base">{item.answer}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Dijawab {formatTanggal(item.published_at)}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
