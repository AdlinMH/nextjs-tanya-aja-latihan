import { DaftarPublik } from "@/components/daftar-publik";
import { FormPertanyaan } from "@/components/form-pertanyaan";

// Tampilan pengunjung: form kirim pertanyaan + daftar jawaban publik.
// footer berisi link Login (pengunjung) atau Kelola/Keluar (pemilik).
export function TampilanPengunjung({ pertanyaan, footer }) {
  return (
    <>
      <main className="flex flex-col gap-10">
        <section aria-labelledby="judul-kirim">
          <h1 id="judul-kirim" className="sr-only">
            Kirim pertanyaan
          </h1>
          <p className="mb-4 text-center text-base text-muted-foreground">
            Punya pertanyaan? Kirim saja.{" "}
            <strong className="text-foreground">Namamu tidak ikut terkirim.</strong>
          </p>
          <FormPertanyaan />
        </section>

        <section aria-labelledby="judul-jawaban">
          <h2 id="judul-jawaban" className="mb-4 text-lg font-semibold">
            Sudah dijawab
          </h2>
          <DaftarPublik pertanyaan={pertanyaan} />
        </section>
      </main>

      <footer className="mt-12 flex justify-center gap-2 border-t pt-4 text-sm text-muted-foreground">
        {footer}
      </footer>
    </>
  );
}
