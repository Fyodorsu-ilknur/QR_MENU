let tumUrunler = []; 
// 'A' yaparsan filtreleme modu, 'B' yaparsan tüm kategorilerin alt alta olduğu mod çalışır.
let aktifMod = 'A'; 

/**
 * API'den ürün verilerini çeker ve uygulamayı başlatır.
 */
async function verileriGetir() {
    try {
        const response = await fetch("https://api.qrmenu.e-prometrik.com/urunler/getir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "IsletmeId": 18 })
        });

        const veri = await response.json();
        tumUrunler = veri.urunler; 
        
        kategorileriHazirla();
        ekraniGuncelle(tumUrunler);
    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
}

/**
 * Mobildeki dropdown ve masaüstündeki sidebar için kategori butonlarını hazırlar.
 */
function kategorileriHazirla() {
    const mobilListe = document.getElementById("kategori-bar-mobil");
    const masaustuBar = document.getElementById("kategori-bar-masaustu");
    const kategoriler = [...new Set(tumUrunler.map(u => u.grupIsim))];

    // Şablonlar: İkonlu ve modern tasarıma uygun butonlar
    const htmlMobil = (grup) => `<li><a class="dropdown-item" href="#" onclick="filtrele('${grup}', this)">🍴 ${grup}</a></li>`;
    const htmlMasaustu = (grup) => `
        <button class="kategori-btn" onclick="filtrele('${grup}', this)">
            <span class="me-3">${grup === 'Tümü' ? '🔍' : '🍴'}</span> ${grup}
        </button>`;

    // Listeleri doldur
    mobilListe.innerHTML = htmlMobil('Tümü');
    masaustuBar.innerHTML = htmlMasaustu('Tümü');

    kategoriler.forEach(k => {
        mobilListe.innerHTML += htmlMobil(k);
        masaustuBar.innerHTML += htmlMasaustu(k);
    });
}

/**
 * Seçilen kategoriye göre filtreleme yapar ve menüyü günceller.
 */
function filtrele(grupAdi, element) {
    // 1. UI Güncelleme: Mobilde seçilen başlığı değiştir
    document.getElementById("secili-kategori-adi").innerText = "🍴 " + grupAdi;
    
    // 2. Senkronizasyon: Tüm butonlardaki aktif sınıflarını temizle
    document.querySelectorAll('.kategori-btn, .dropdown-item').forEach(el => el.classList.remove('active'));
    
    // 3. Tıklanan butonu aktif yap (Aynı isimli butonu hem mobilde hem masaüstünde bulup işaretler)
    document.querySelectorAll('.kategori-btn, .dropdown-item').forEach(btn => {
        if(btn.innerText.includes(grupAdi)) btn.classList.add('active');
    });

    // 4. Veriyi süz ve ekrana bas
    const suzulenler = grupAdi === 'Tümü' ? tumUrunler : tumUrunler.filter(u => u.grupIsim === grupAdi);
    ekraniGuncelle(suzulenler);

    // 5. Mobil Deneyim: Ürünlerin başına yumuşak kaydır
    if (window.innerWidth < 768) { 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
}

function ekraniGuncelle(liste) {
    aktifMod === 'B' ? menuDizModB(liste) : menuDizModA(liste);
}

function menuDizModA(liste) {
    const menuAlani = document.getElementById("menu-alani");
    menuAlani.innerHTML = "";
    liste.forEach(urun => menuAlani.innerHTML += urunKartOlustur(urun));
}

function menuDizModB(liste) {
    const menuAlani = document.getElementById("menu-alani");
    menuAlani.innerHTML = "";
    const gruplar = {};
    liste.forEach(u => {
        if (!gruplar[u.grupIsim]) gruplar[u.grupIsim] = [];
        gruplar[u.grupIsim].push(u);
    });
    for (const grup in gruplar) {
        menuAlani.innerHTML += `<div class="col-12"><div class="kategori-baslik">${grup}</div></div>`;
        gruplar[grup].forEach(urun => menuAlani.innerHTML += urunKartOlustur(urun));
    }
}

function urunKartOlustur(urun) {
    return `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="card h-100 urun-karti shadow-sm border-0">
                <img src="${urun.resimYolu}" class="card-img-top" alt="${urun.urunAdi}">
                <div class="card-body p-3 text-center">
                    <h6 class="fw-bold mb-2" style="font-size:0.9rem; min-height:40px; display:flex; align-items:center; justify-content:center;">${urun.urunAdi}</h6>
                    <p class="text-muted small mb-3" style="font-size:0.7rem; height:32px; overflow:hidden;">${urun.aciklama || ''}</p>
                    <div class="fiyat-yazisi shadow-sm">${urun.fiyat} TL</div>
                </div>
            </div>
        </div>`;
}

verileriGetir();