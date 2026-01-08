import Script from "next/script";
import Footer from '@/components/public/Footer';
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href="/fonts/icomoon/style.css" />
      <link rel="stylesheet" href="/fonts/flaticon/font/flaticon.css" />
      <link rel="stylesheet" href="/css/tiny-slider.css" />
      <link rel="stylesheet" href="/css/aos.css" />
      <link rel="stylesheet" href="/css/style.css" />
      <link rel="stylesheet" href="/css/bootstrap.css" />
      
      


      <div className="site-mobile-menu site-navbar-target">
        <div className="site-mobile-menu-header">
          <div className="site-mobile-menu-close">
            <span className="icofont-close js-menu-toggle"></span>
          </div>
        </div>
        <div className="site-mobile-menu-body"></div>
      </div>

      <nav className="site-nav">
        <div className="container">
          <div className="menu-bg-wrap">
            <div className="site-navigation">
              <a href="/" className="logo m-0 float-start">Penginapan Amtsilati</a>
              <ul className="js-clone-nav d-none d-lg-inline-block text-start site-menu float-end">
                <li className="active"><a href="/">Home</a></li>
                <li className="active"><a href="/properties">Daftar Kamar</a></li> 
                <li><a href="https://lynk.id/amtsilatipusat?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAb21jcAOvOp1leHRuA2FlbQIxMQBzcnRjBmFwcF9pZA81NjcwNjczNDMzNTI0MjcAAadES9pITCLEkucJao99To2E1MkyR4u3MFDq1kGrWnXQexaCZWn4OFPjr18tZw_aem_8rrrblkF4DqRggcU2wWdEw">Tentang Kami</a></li>
                <li><a href="/contact">Kontak</a></li>
              </ul>
              <a href="#" className="burger light me-auto float-end mt-1 site-menu-toggle js-menu-toggle d-inline-block d-lg-none" data-toggle="collapse" data-target="#main-navbar">
                <span></span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {children}

      <Footer />

      <Script src="/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
<Script src="/js/tiny-slider.js"       strategy="afterInteractive" />
<Script src="/js/aos.js"               strategy="afterInteractive" />
<Script src="/js/navbar.js"            strategy="afterInteractive" />
<Script src="/js/counter.js"           strategy="afterInteractive" />
<Script src="/js/custom.js"            strategy="afterInteractive" />
    </>
  );
}