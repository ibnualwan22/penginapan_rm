import { 
  Clock, 
  Sparkles, 
  Tv, 
  BookOpen, 
  Moon, 
  GraduationCap, 
  CigaretteOff, 
  ShieldCheck,
  Info
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"

export default function RulesPage() {
  const rules = [
    {
      title: "Jam Check-in & Check-out",
      description: "Berlaku sistem 24 jam (Jam keluar sama dengan jam masuk). Keterlambatan check-out akan dikenakan denda sebesar Rp 20.000 per jam.",
      icon: Clock,
    },
    {
      title: "Kebersihan & Kerapihan",
      description: "Tamu wajib menjaga kebersihan kamar, kamar mandi, dan area sekitar hotel. Buanglah sampah pada tempat yang telah disediakan.",
      icon: Sparkles,
    },
    {
      title: "Fasilitas Hotel",
      description: "Tamu diperkenankan menggunakan fasilitas yang tersedia (TV, Handuk, Taman, dll) dengan bijak dan tidak merusaknya.",
      icon: Tv,
    },
    {
      title: "Menghormati Aktivitas Agama",
      description: "Mengingat lokasi berada di lingkungan pesantren, tamu dimohon menghormati kegiatan pengajian, sholat berjamaah, dan aktivitas religi lainnya.",
      icon: BookOpen,
    },
    {
      title: "Jam Malam & Ketenangan",
      description: "Jam malam berlaku mulai pukul 22.00 WIB. Mohon tidak membuat kegaduhan atau kebisingan yang dapat mengganggu istirahat santri dan tamu lain.",
      icon: Moon,
    },
    {
      title: "Menghormati Santri",
      description: "Tamu diharapkan menjaga sopan santun dan menghormati privasi serta aktivitas belajar para santri di lingkungan pondok.",
      icon: GraduationCap,
    },
    {
      title: "Area Bebas Rokok & Miras",
      description: "DILARANG KERAS merokok, mengonsumsi minuman keras, atau membawa obat-obatan terlarang di seluruh area hotel dan pondok pesantren.",
      icon: CigaretteOff,
      highlight: true // Untuk memberi warna merah peringatan
    },
    {
      title: "Keamanan Barang",
      description: "Harap menjaga barang bawaan pribadi. Pihak penginapan tidak bertanggung jawab atas kehilangan barang berharga yang ditinggalkan tanpa pengawasan.",
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* HERO HEADER */}
      <div className="bg-[#005244] py-16 text-center text-white px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Peraturan & Tata Tertib
        </h1>
        <p className="text-emerald-100 max-w-2xl mx-auto text-lg">
          Demi kenyamanan, keamanan, dan keberkahan bersama di lingkungan Penginapan Pondok Pesantren Darul Falah Amtsilati.
        </p>
      </div>

      {/* CONTENT GRID */}
      <div className="container mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rules.map((rule, index) => (
            <Card 
              key={index} 
              className={`border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden ${rule.highlight ? 'ring-2 ring-red-100' : ''}`}
            >
              <div className={`h-2 w-full ${rule.highlight ? 'bg-red-500' : 'bg-[#005244]'}`} />
              <CardContent className="pt-6 pb-6 px-6 flex flex-col items-center text-center h-full">
                
                {/* Icon Wrapper */}
                <div className={`mb-4 p-3 rounded-full ${rule.highlight ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-[#005244]'}`}>
                  <rule.icon className="w-8 h-8" />
                </div>

                <h3 className={`font-bold text-lg mb-3 ${rule.highlight ? 'text-red-700' : 'text-slate-800'}`}>
                  {index + 1}. {rule.title}
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed">
                  {rule.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FOOTNOTE */}
        <div className="mt-12 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-blue-50 text-blue-800 rounded-lg gap-3 shadow-sm border border-blue-100">
            <Info className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium text-left">
              Dengan melakukan Check-in, tamu dianggap telah membaca, memahami, dan menyetujui seluruh peraturan yang berlaku di Penginapan Amtsilati.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}