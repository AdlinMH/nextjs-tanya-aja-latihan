import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { ModePemilik } from "@/components/mode-pemilik";
import { TampilanPengunjung } from "@/components/tampilan-pengunjung";
import { TombolLogin } from "@/components/tombol-login";
import { daftarPemilik, daftarPublik } from "@/lib/pertanyaan";
import { cekSesiPemilik } from "@/lib/sesi";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <Logo />
      </header>

      {/* Bagian ini membaca cookie dan database, jadi dimuat saat request. */}
      <Suspense fallback={<Memuat />}>
        <Isi />
      </Suspense>
    </div>
  );
}

async function Isi() {
  // Tandai bagian ini selalu dibuat ulang per request (tidak di-cache).
  await connection();

  let pemilik = false;
  let data = [];

  try {
    pemilik = await cekSesiPemilik();
    // Data privat hanya diambil jika sesi pemilik valid.
    data = pemilik ? await daftarPemilik() : await daftarPublik();
  } catch (e) {
    console.error(e.message);
    return <Gangguan />;
  }

  if (pemilik) {
    return <ModePemilik pertanyaan={data} />;
  }

  return <TampilanPengunjung pertanyaan={data} footer={<TombolLogin />} />;
}

function Memuat() {
  return (
    <p role="status" className="py-10 text-center text-muted-foreground">
      Memuat...
    </p>
  );
}

function Gangguan() {
  return (
    <div role="alert" className="rounded-xl border bg-card p-6 text-center">
      <p className="font-semibold">Halaman belum bisa dimuat.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Coba muat ulang halaman beberapa saat lagi.
      </p>
    </div>
  );
}
