"use client";

import { useRef, useState, useTransition } from "react";
import { kirimPertanyaan } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BATAS } from "@/lib/batas";

export function FormPertanyaan() {
  const [teks, setTeks] = useState("");
  const [pesan, setPesan] = useState(null); // { jenis: "sukses" | "gagal", teks }
  const [sedangKirim, startTransition] = useTransition();
  const sedangJalan = useRef(false); // penjaga klik ganda (langsung berubah, tanpa menunggu render)

  function kirim(event) {
    event.preventDefault();
    if (sedangJalan.current) return; // cegah kirim ganda

    if (teks.trim().length === 0) {
      setPesan({ jenis: "gagal", teks: "Pertanyaan tidak boleh kosong." });
      return;
    }

    setPesan(null);
    sedangJalan.current = true;
    startTransition(async () => {
      try {
        const hasil = await kirimPertanyaan(teks);
        if (hasil?.ok) {
          setTeks(""); // kosongkan hanya jika benar-benar tersimpan
          setPesan({
            jenis: "sukses",
            teks: "Pertanyaanmu sudah terkirim. Jawaban akan muncul di bawah jika sudah dipublikasikan.",
          });
        } else {
          setPesan({ jenis: "gagal", teks: hasil?.error || "Gagal mengirim. Coba lagi." });
        }
      } catch {
        setPesan({ jenis: "gagal", teks: "Koneksi bermasalah. Pertanyaanmu belum terkirim, coba lagi." });
      } finally {
        sedangJalan.current = false;
      }
    });
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <Label htmlFor="pertanyaan" className="sr-only">
        Pertanyaan
      </Label>
      <Textarea
        id="pertanyaan"
        name="pertanyaan"
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        placeholder="Ketik pertanyaanmu di sini..."
        maxLength={BATAS.pertanyaanMaks}
        rows={4}
        className="min-h-28 resize-y text-base"
        aria-describedby="hitung-karakter pesan-form"
      />
      <div className="flex items-center justify-between gap-3">
        <span id="hitung-karakter" className="text-xs text-muted-foreground">
          {teks.length}/{BATAS.pertanyaanMaks}
        </span>
        <Button type="submit" size="lg" disabled={sedangKirim} className="px-5">
          {sedangKirim ? "Mengirim..." : "Kirim pertanyaan"}
        </Button>
      </div>
      <p
        id="pesan-form"
        role="status"
        aria-live="polite"
        className={
          pesan?.jenis === "sukses"
            ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
            : pesan
              ? "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
              : "sr-only"
        }
      >
        {pesan?.teks}
      </p>
    </form>
  );
}
