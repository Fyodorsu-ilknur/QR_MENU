"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Search, ChefHat, Info, ChevronDown } from "lucide-react";

interface Product {
    urunAdi: string;
    resimYolu: string;
    aciklama: string;
    fiyat: number;
    grupIsim: string;
}

interface MenuAppProps {
    initialProducts: Product[];
    businessName?: string;
    businessLogo?: string;
}

export default function MenuApp({ initialProducts, businessName, businessLogo }: MenuAppProps) {
    const [activeCategory, setActiveCategory] = useState<string>("Tümü");
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [logoSrc, setLogoSrc] = useState<string | null>(null);

    // Yardımcı fonksiyon: URL'i Base64'e çevirir
    async function getBase64(url: string): Promise<string | null> {
        try {
            const res = await fetch(url);
            const blob = await res.blob();

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Base64 çevrim hatası:", e);
            return null;
        }
    }

    useEffect(() => {
        const loadLogo = async () => {
            if (!businessLogo) {
                setLogoSrc(null);
                return;
            }

            // Zaten Base64 veya yerel yol ise direkt kullan
            if (businessLogo.startsWith("data:") || businessLogo.startsWith("/")) {
                setLogoSrc(businessLogo);
                return;
            }

            // HTTP ile başlıyorsa (URL ise) Base64'e çevirmeyi dene
            if (businessLogo.startsWith("http")) {
                const base64 = await getBase64(businessLogo);
                if (base64) {
                    setLogoSrc(base64);
                } else {
                    // Çevrilemezse olduğu gibi kullan (fallback)
                    setLogoSrc(businessLogo);
                }
            } else {
                // Http/s ile başlamıyorsa ve data değilse, ham Base64 string varsayıyoruz
                setLogoSrc(`data:image/png;base64,${businessLogo}`);
            }
        };

        loadLogo();
    }, [businessLogo]);

    // Benzersiz kategorileri verimli bir şekilde ayıkla
    const categories = useMemo(() => {
        const cats = Array.from(new Set(initialProducts.map((p) => p.grupIsim)));
        return ["Tümü", ...cats];
    }, [initialProducts]);

    // Kategori ve arama terimine göre ürünleri filtrele
    const filteredProducts = useMemo(() => {
        return initialProducts.filter((p) => {
            const matchesCategory =
                activeCategory === "Tümü" || p.grupIsim === activeCategory;
            const matchesSearch = p.urunAdi
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [initialProducts, activeCategory, searchTerm]);

    const handleCategoryClick = (cat: string) => {
        setActiveCategory(cat);
        setIsDropdownOpen(false);
        // Kategori değiştiğinde yukarı kaydır
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="app-layout">
            {/* Üst Bilgi (Header) */}
            <header>
                <div className="container header-content">
                    <div className="logo-area">
                        {logoSrc ? (
                            <img
                                src={logoSrc}
                                alt={businessName}
                                className="logo-img"
                                style={{ maxHeight: '50px', width: 'auto' }}
                            />
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-1 bg-orange-100 rounded-full"
                            >
                                <Utensils className="text-orange-500" size={24} color="var(--primary)" />
                            </motion.div>
                        )}
                        <h1 className="brand-name">{logoSrc ? '' : businessName}</h1>
                    </div>

                    {/* İsteğe bağlı: Basit Arama Tetikleyici veya Bilgi İkonu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Info size={20} color="var(--text-secondary)" />
                    </div>
                </div>
            </header>

            <div className="container layout-grid">
                {/* Masaüstü Yan Menü (Mobilde Gizli) */}
                <aside className="category-nav hidden-scrollbar desktop-only">
                    <h3 className="product-title" style={{ marginBottom: '1rem', paddingLeft: '0.5rem', display: 'none', opacity: 0.5 }}>
                        MENÜ
                    </h3>
                    <div className="category-list">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className={`cat-btn ${activeCategory === cat ? "active" : ""}`}
                            >
                                {cat === "Tümü" ? <Search size={16} /> : <Utensils size={16} />}
                                {cat}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Mobil Açılır Menü (Masaüstünde Gizli) */}
                <div className="mobile-category-dropdown mobile-only">
                    <button
                        className="dropdown-trigger"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="flex items-center gap-2">
                            <Utensils size={18} />
                            {activeCategory}
                        </span>
                        <ChevronDown
                            size={18}
                            style={{
                                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="dropdown-menu shadow-lg"
                            >
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategoryClick(cat)}
                                        className={`dropdown-item ${activeCategory === cat ? "active" : ""}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Ana İçerik Alanı */}
                <main className="products-area">
                    {/* Arama Girişi (Mobil/Masaüstü tutarlı) */}
                    <div style={{ marginBottom: '2rem', position: 'relative' }}>
                        <Search className="text-secondary" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
                        <input
                            type="text"
                            placeholder="Menüde ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid #e5e7eb',
                                background: 'var(--bg-surface)',
                                fontSize: '1rem',
                                outline: 'none',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        />
                    </div>

                    <div className="grid">
                        {activeCategory === "Tümü" && !searchTerm ? (
                            categories.filter(c => c !== "Tümü").map(cat => {
                                const productsInCat = filteredProducts.filter(p => p.grupIsim === cat);
                                if (productsInCat.length === 0) return null;

                                return (
                                    <>
                                        <div key={`header-${cat}`} className="section-title">
                                            <Utensils size={24} />
                                            {cat}
                                        </div>
                                        {productsInCat.map((product) => (
                                            <div
                                                key={`${product.grupIsim}-${product.urunAdi}`}
                                                className="product-card"
                                            >
                                                <div className="card-image-wrapper">
                                                    <img
                                                        src={product.resimYolu || "https://placehold.co/400x300?text=No+Image"}
                                                        alt={product.urunAdi}
                                                        className="card-img"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="card-content">
                                                    <h3 className="product-title">{product.urunAdi}</h3>
                                                    <p className="product-desc">{product.aciklama}</p>
                                                    <div className="product-footer">
                                                        <span className="price-tag">{product.fiyat} ₺</span>
                                                        <button className="add-btn">
                                                            <ChefHat size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                );
                            })
                        ) : (
                            filteredProducts.map((product) => (
                                <div
                                    key={`${product.grupIsim}-${product.urunAdi}`}
                                    className="product-card"
                                >
                                    <div className="card-image-wrapper">
                                        <img
                                            src={product.resimYolu || "https://placehold.co/400x300?text=No+Image"}
                                            alt={product.urunAdi}
                                            className="card-img"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="card-content">
                                        <h3 className="product-title">{product.urunAdi}</h3>
                                        <p className="product-desc">{product.aciklama}</p>
                                        <div className="product-footer">
                                            <span className="price-tag">{product.fiyat} ₺</span>
                                            <button className="add-btn">
                                                <ChefHat size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="empty-state">
                            <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3>Ürün bulunamadı</h3>
                            <p>Farklı bir arama yapmayı deneyin.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
