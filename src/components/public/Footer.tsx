import { MapPin, Facebook, Instagram, Youtube, MessageCircle, Car, Coffee } from 'lucide-react'

export default function Footer() {
  // Update Nomor WhatsApp Terbaru
  const waRJ = "6285741193660"        // Admin RJ
  const waRM = "6285842817105"        // Resepsionis Hotel RM
  const waCafe = "6288215278401"      // Cafe Arwana
  const waMobil = "62882007534377"    // Mobil Layanan (Nomor Utama)

  return (
    // Menggunakan warna custom hex sesuai screenshot navbar (#005244)
    <footer className="bg-[#005244] text-white border-t border-[#003d33]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* KOLOM 1: Identitas & Alamat */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Penginapan Amtsilati
            </h2>
            <p className="text-emerald-50 text-sm leading-relaxed max-w-sm">
              Kenyamanan menginap di lingkungan pesantren. Melayani wali santri dan tamu umum dengan sepenuh hati.
            </p>
            
            <div className="flex items-start gap-3 text-sm pt-2">
              <MapPin className="w-5 h-5 text-emerald-200 shrink-0 mt-0.5" />
              <span>
                Jl. Sidorejo, Bangsri, Kab. Jepara,<br />
                Jawa Tengah 59453
              </span>
            </div>

            <div className="flex gap-4 pt-4">
              <a href="#" className="hover:text-emerald-200 transition-colors bg-[#004236] p-2 rounded-full"><Facebook className="w-5 h-5"/></a>
              <a href="#" className="hover:text-emerald-200 transition-colors bg-[#004236] p-2 rounded-full"><Instagram className="w-5 h-5"/></a>
              <a href="#" className="hover:text-emerald-200 transition-colors bg-[#004236] p-2 rounded-full"><Youtube className="w-5 h-5"/></a>
            </div>
          </div>

          {/* KOLOM 2: Pusat Kontak (Contact Center) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Hubungi Kami</h3>
            <div className="grid gap-3">
                
                {/* 1. Admin RJ */}
                <a 
                  href={`https://wa.me/${waRJ}?text=Assalamualaikum,%20admin%20RJ`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-sm bg-[#004236]/60 p-3 rounded-lg hover:bg-[#00352b] transition-colors border border-white/10"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div>
                    <span className="block font-bold text-emerald-50">Admin RJ (Gratis)</span>
                    <span className="text-xs text-emerald-200">+62 857-4119-3660</span>
                  </div>
                </a>

                {/* 2. Admin RM */}
                <a 
                  href={`https://wa.me/${waRM}?text=Assalamualaikum,%20admin%20Hotel%20RM`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-sm bg-[#004236]/60 p-3 rounded-lg hover:bg-[#00352b] transition-colors border border-white/10"
                >
                  <MessageCircle className="w-5 h-5 text-yellow-300 shrink-0" />
                  <div>
                    <span className="block font-bold text-emerald-50">Resepsionis Hotel RM</span>
                    <span className="text-xs text-emerald-200">+62 858-4281-7105</span>
                  </div>
                </a>

                <div className="grid grid-cols-2 gap-3">
                    {/* 3. Cafe Arwana */}
                    <a 
                      href={`https://wa.me/${waCafe}`}
                      target="_blank" rel="noreferrer"
                      className="flex flex-col items-center justify-center gap-1 text-sm bg-[#004236]/60 p-3 rounded-lg hover:bg-[#00352b] transition-colors border border-white/10 text-center"
                    >
                      <Coffee className="w-5 h-5 text-orange-300" />
                      <div>
                        <span className="block font-bold text-xs text-emerald-50">Cafe Arwana</span>
                        <span className="text-[10px] text-emerald-200">0882-1527-8401</span>
                      </div>
                    </a>

                    {/* 4. Mobil Layanan */}
                    <a 
                      href={`https://wa.me/${waMobil}`}
                      target="_blank" rel="noreferrer"
                      className="flex flex-col items-center justify-center gap-1 text-sm bg-[#004236]/60 p-3 rounded-lg hover:bg-[#00352b] transition-colors border border-white/10 text-center"
                    >
                      <Car className="w-5 h-5 text-blue-300" />
                      <div>
                        <span className="block font-bold text-xs text-emerald-50">Mobil Tamu</span>
                        <span className="text-[10px] text-emerald-200">0882-0075-3437</span>
                      </div>
                    </a>
                </div>

            </div>
          </div>

          {/* KOLOM 3: Peta Lokasi */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Lokasi</h3>
            <div className="rounded-xl overflow-hidden shadow-lg border-2 border-[#003d33] h-[220px] bg-[#00352b] relative group">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d985.2526002066114!2d110.75961650124002!3d-6.522455643892165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7123c83f3c3397%3A0x8a54b85346654d15!2sHotel%20Roudlotul%20Muta'allimin%20Amtsilati%20(RM)!5e0!3m2!1sid!2sid!4v1767872728788!5m2!1sid!2sid" 
                className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Peta Lokasi Penginapan Amtsilati"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-200 justify-center">
                <MapPin className="w-3 h-3" />
                <span>Komplek Ponpes Amtsilati, Bangsri</span>
            </div>
          </div>

        </div>

        <div className="border-t border-[#004236] mt-12 pt-8 text-center text-sm text-emerald-100/60">
          <p>© {new Date().getFullYear()} Penginapan Amtsilati. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}