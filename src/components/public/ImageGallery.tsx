'use client';
import { useEffect } from "react";

export default function ImageGallery({ images }: { images: { id: string, url: string }[] }) {

    useEffect(() => {
        // Inisialisasi Tiny Slider untuk galeri
        if (typeof (window as any).tns === 'function' && images.length > 1) {
            (window as any).tns({
                container: '.img-property-slide',
                items: 1,
                autoplay: true,
                autoplayButtonOutput: false,
                controls: true,
                nav: true,
            });
        }
    }, [images]);

    if (!images || images.length === 0) {
        return <img src="/images/img_1.jpg" alt="Placeholder" className="img-fluid rounded-lg" />;
    }

    return (
        <div className="img-property-slide-wrap">
            <div className="img-property-slide">
                {images.map(image => (
                    <div key={image.id}>
                        <img src={image.url} alt="Foto Kamar" className="img-fluid rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}