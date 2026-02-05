"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Search, ChefHat, Info, ChevronDown, ChevronRight } from "lucide-react";

interface Product {
    id?: number;
    urunAdi: string;
    resimYolu: string;
    aciklama: string;
    fiyat: number;
    grupIsim: string;
    grupId?: number;
    ustGrupIsim?: string;
    ustGrupId?: number;
    sira?: number;
}

interface MenuAppProps {
    initialProducts: Product[];
    businessName?: string;
    businessLogo?: string;
}

export default function MenuApp({ initialProducts, businessName, businessLogo }: MenuAppProps) {
    // Görünüm mantığını belirlemek için veriyi kontrol et
    const hasUstGrup = useMemo(() => {
        return initialProducts.some(p => !!p.ustGrupIsim);
    }, [initialProducts]);

    // 1. Üst Grupları (Top Categories) Çıkar
    // Bu hesaplamayı state'den önce yapıyoruz ki state başlangıç değerini verebilelim
    const topCategories = useMemo(() => {
        if (hasUstGrup) {
            const tops = Array.from(new Set(initialProducts.map(p => p.ustGrupIsim).filter(Boolean))) as string[];
            // API'den gelen sırayı koru, başa "Tümü" ekle
            return ["Tümü", ...tops];
        } else {
            // Eski mantık: Sadece grup isimleri (Categories)
            const cats = Array.from(new Set(initialProducts.map((p) => p.grupIsim)));
            return ["Tümü", ...cats];
        }
    }, [initialProducts, hasUstGrup]);

    // State başlangıç değeri: Her zaman "Tümü"
    const [activeTopCategory, setActiveTopCategory] = useState<string>("Tümü");

    const [activeSubCategory, setActiveSubCategory] = useState<string>("");
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

            if (businessLogo.startsWith("data:") || businessLogo.startsWith("/")) {
                setLogoSrc(businessLogo);
                return;
            }

            if (businessLogo.startsWith("http")) {
                const base64 = await getBase64(businessLogo);
                if (base64) {
                    setLogoSrc(base64);
                } else {
                    setLogoSrc(businessLogo);
                }
            } else {
                setLogoSrc(`data:image/png;base64,${businessLogo}`);
            }
        };

        loadLogo();
    }, [businessLogo]);

    // --- Kategori Mantığı ---
    // topCategories yukarı taşındı.

    // (Eski useEffect burada kaldırıldı)

    // 2. Alt Grupları (Sub Categories) Çıkar (Seçili Üst Gruba Göre)
    const subCategories = useMemo(() => {
        if (!hasUstGrup) return [];
        if (!activeTopCategory) return [];

        const subs = Array.from(new Set(
            initialProducts
                .filter(p => p.ustGrupIsim === activeTopCategory)
                .map(p => p.grupIsim)
        ));
        return subs;
    }, [initialProducts, activeTopCategory, hasUstGrup]);

    // Üst kategori değiştiğinde ilk alt kategoriyi seç
    useEffect(() => {
        if (hasUstGrup && activeTopCategory && activeTopCategory !== "Tümü" && subCategories.length > 0) {
            // Eğer mevcut seçili alt kategori yeni listede yoksa ilkini seç
            if (!subCategories.includes(activeSubCategory)) {
                setActiveSubCategory(subCategories[0]);
            }
        } else if (activeTopCategory === "Tümü") {
            // "Tümü" seçiliyken alt kategoriyi temizle
            setActiveSubCategory("");
        }
    }, [activeTopCategory, subCategories, hasUstGrup, activeSubCategory]);


    // 3. Ürünleri Filtrele ve Kategoriye Göre Grupla
    const filteredProducts = useMemo(() => {
        let products = initialProducts.filter((p) => {
            // Arama filtresi her zaman geçerli
            const matchesSearch = p.urunAdi.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (activeTopCategory === "Tümü") {
                // "Tümü" seçiliyken tüm ürünleri göster
                return true;
            }

            if (hasUstGrup) {
                // Hiyerarşik mod
                const matchesTop = p.ustGrupIsim === activeTopCategory;
                const matchesSub = activeSubCategory ? p.grupIsim === activeSubCategory : true;
                return matchesTop && matchesSub;
            } else {
                // Düz mod
                return p.grupIsim === activeTopCategory;
            }
        });

        // "Tümü" seçiliyken ürünleri kategori sırasına göre sırala
        if (activeTopCategory === "Tümü") {
            products.sort((a, b) => {
                // Önce üst grup sırasına göre (varsa)
                if (hasUstGrup) {
                    if (a.ustGrupIsim !== b.ustGrupIsim) {
                        const aUstIndex = topCategories.indexOf(a.ustGrupIsim || "");
                        const bUstIndex = topCategories.indexOf(b.ustGrupIsim || "");
                        if (aUstIndex !== bUstIndex) return aUstIndex - bUstIndex;
                    }
                    // Aynı üst grupta ise alt grup sırasına göre
                    if (a.grupIsim !== b.grupIsim) {
                        const aGrupIndex = initialProducts.findIndex(p => p.grupIsim === a.grupIsim);
                        const bGrupIndex = initialProducts.findIndex(p => p.grupIsim === b.grupIsim);
                        return aGrupIndex - bGrupIndex;
                    }
                } else {
                    // Üst grup yoksa sadece grup sırasına göre
                    if (a.grupIsim !== b.grupIsim) {
                        const aGrupIndex = initialProducts.findIndex(p => p.grupIsim === a.grupIsim);
                        const bGrupIndex = initialProducts.findIndex(p => p.grupIsim === b.grupIsim);
                        return aGrupIndex - bGrupIndex;
                    }
                }
                // Aynı kategoride ise sira alanına göre (varsa)
                if (a.sira !== undefined && b.sira !== undefined) {
                    return a.sira - b.sira;
                }
                return 0;
            });
        }

        return products;
    }, [initialProducts, activeTopCategory, activeSubCategory, searchTerm, hasUstGrup, topCategories]);

    // Ürünleri kategoriye göre grupla (sadece "Tümü" seçiliyken)
    const groupedProducts = useMemo(() => {
        if (activeTopCategory !== "Tümü") {
            return null; // Gruplama gerekmez
        }

        const groups: { categoryName: string; products: Product[] }[] = [];
        let currentCategory = "";
        let currentGroup: Product[] = [];

        filteredProducts.forEach((product) => {
            let categoryName: string;
            if (hasUstGrup) {
                // Üst grup varsa: "Üst Grup - Alt Grup" formatında göster
                categoryName = product.ustGrupIsim && product.grupIsim 
                    ? `${product.ustGrupIsim} - ${product.grupIsim}`
                    : product.grupIsim || product.ustGrupIsim || "";
            } else {
                // Üst grup yoksa sadece grup ismini göster
                categoryName = product.grupIsim;
            }

            if (categoryName !== currentCategory) {
                // Yeni kategori başladı, önceki grubu kaydet
                if (currentGroup.length > 0) {
                    groups.push({ categoryName: currentCategory, products: currentGroup });
                }
                currentCategory = categoryName;
                currentGroup = [product];
            } else {
                currentGroup.push(product);
            }
        });

        // Son grubu da ekle
        if (currentGroup.length > 0) {
            groups.push({ categoryName: currentCategory, products: currentGroup });
        }

        return groups;
    }, [filteredProducts, activeTopCategory, hasUstGrup]);

    const handleTopCategoryClick = (cat: string) => {
        if (activeTopCategory === cat) {
            setActiveTopCategory("");
        } else {
            setActiveTopCategory(cat);
        }
        setIsDropdownOpen(false);
        // window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubCategoryClick = (subCat: string) => {
        setActiveSubCategory(subCat);
        // Alt kategori değiştiğinde ürünlerin başına hafifçe kaydırılabilir
        // window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="app-layout">
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Info size={20} color="var(--text-secondary)" />
                    </div>
                </div>
            </header>

            <div className="container layout-grid">
                {/* --- Yan Menü (Top Categories) --- */}
                <aside className="category-nav hidden-scrollbar desktop-only">
                    <h3 className="product-title" style={{ marginBottom: '1rem', paddingLeft: '0.5rem', opacity: 0.7, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {hasUstGrup ? 'MENÜ' : 'KATEGORİLER'}
                    </h3>
                    <div className="category-list">
                        {topCategories.map((cat) => (
                            <div key={cat} className="flex flex-col">
                                <button
                                    type="button"
                                    onClick={() => handleTopCategoryClick(cat)}
                                    className={`cat-btn ${activeTopCategory === cat ? "active" : ""}`}
                                    style={{ justifyContent: 'space-between', width: '100%' }}
                                >
                                    <span className="flex items-center gap-2">
                                        {cat === "Tümü" ? <Search size={16} /> : <Utensils size={16} />}
                                        {cat}
                                    </span>
                                    {hasUstGrup && activeTopCategory === cat && activeTopCategory !== "Tümü" && (
                                        <ChevronDown size={16} />
                                    )}
                                </button>

                                {/* Masaüstü Alt Kategori Listesi (Accordion) */}
                                {hasUstGrup && activeTopCategory === cat && activeTopCategory !== "Tümü" && (
                                    <div className="sub-cat-list pl-4 mt-2 flex flex-col gap-1 border-l-2 border-gray-100 ml-4">
                                        {subCategories.map((sub) => (
                                            <button
                                                key={sub}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSubCategoryClick(sub);
                                                }}
                                                className={`sub-cat-sidebar-btn text-left px-3 py-2 text-sm rounded-md transition-colors ${activeSubCategory === sub
                                                    ? "text-orange-600 font-semibold bg-orange-50"
                                                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* --- Mobil Dropdown (Top Categories) --- */}
                <div className="mobile-category-dropdown mobile-only">
                    <button
                        className="dropdown-trigger"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="flex items-center gap-2">
                            <Utensils size={18} />
                            {activeTopCategory}
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
                                {topCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => handleTopCategoryClick(cat)}
                                        className={`dropdown-item ${activeTopCategory === cat ? "active" : ""}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <main className="products-area">
                    {/* Arama Alanı */}
                    <div style={{ marginBottom: '1rem', position: 'relative' }}>
                        <Search className="text-secondary" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
                        <input
                            type="text"
                            placeholder="Ürün ara..."
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

                    {/* --- Alt Kategoriler (Sadece Mobil İçin Pills) --- */}
                    {hasUstGrup && subCategories.length > 0 && activeTopCategory !== "Tümü" && (
                        <div className="sub-category-nav hidden-scrollbar mobile-only">
                            {subCategories.map((sub) => (
                                <button
                                    key={sub}
                                    onClick={() => handleSubCategoryClick(sub)}
                                    className={`sub-cat-btn ${activeSubCategory === sub ? "active" : ""}`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Ürün Listesi */}
                    {activeTopCategory === "Tümü" && groupedProducts ? (
                        // "Tümü" seçiliyken kategori başlıklarıyla göster
                        <div>
                            {groupedProducts.map((group, groupIndex) => (
                                <div key={group.categoryName}>
                                    {/* Kategori Başlığı */}
                                    <div style={{
                                        marginTop: groupIndex > 0 ? '2rem' : '0',
                                        marginBottom: '1rem',
                                        paddingTop: groupIndex > 0 ? '1rem' : '0',
                                        borderTop: groupIndex > 0 ? '2px solid #e5e7eb' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <h2 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)',
                                            margin: 0,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {group.categoryName}
                                        </h2>
                                        <div style={{
                                            flex: 1,
                                            height: '1px',
                                            background: 'linear-gradient(to right, #e5e7eb, transparent)'
                                        }} />
                                    </div>
                                    {/* Kategori Ürünleri */}
                                    <div className="grid">
                                        {group.products.map((product) => (
                                            <div
                                                key={`${product.grupIsim}-${product.urunAdi}-${product.id || Math.random()}`}
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Normal mod (kategori seçiliyken)
                        <div className="grid">
                            {filteredProducts.map((product) => (
                                <div
                                    key={`${product.grupIsim}-${product.urunAdi}-${product.id || Math.random()}`}
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
                        </div>
                    )}

                    {filteredProducts.length === 0 && (
                        <div className="empty-state">
                            <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3>Ürün bulunamadı</h3>
                            <p>Bu kategoride henüz ürün yok veya arama sonucu boş.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
