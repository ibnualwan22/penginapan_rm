import Script from "next/script";

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
              <a href="/" className="logo m-0 float-start">GPS PRO</a>
              <ul className="js-clone-nav d-none d-lg-inline-block text-start site-menu float-end">
                <li className="active"><a href="/">Home</a></li>
                <li className="active"><a href="/properties">Daftar Kamar</a></li> 
                <li><a href="/about">Tentang Kami</a></li>
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

      <div className="site-footer">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="widget">
                <h3>Kontak</h3>
                <address>Lokasi Penginapan, Jepara, Jawa Tengah</address>
                <ul className="list-unstyled links">
                  <li><a href="tel://6285842817105">+62 858-4281-7105 (RM)</a></li>
                  <li><a href="tel://6285741193660">+62 857-4119-3660 (RJ)</a></li>
                  <li><a href="mailto:info@ponpesrm.com">info@ponpesrm.com</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Script src="/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
<Script src="/js/tiny-slider.js"       strategy="afterInteractive" />
<Script src="/js/aos.js"               strategy="afterInteractive" />
<Script src="/js/navbar.js"            strategy="afterInteractive" />
<Script src="/js/counter.js"           strategy="afterInteractive" />
<Script src="/js/custom.js"            strategy="afterInteractive" />
    </>
  );
}