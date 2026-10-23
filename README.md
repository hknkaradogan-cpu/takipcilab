# TakipçiLab — Android PWA

TikTok içerik üreticileri için Türkçe büyüme planı, görevler, puanlar ve video fikirleri arayüzü. Kayıt/giriş Supabase Auth ile yapılır.

## 1) Supabase ayarı
1. https://supabase.com üzerinden yeni proje oluştur.
2. Project Settings → API bölümünden Project URL ve publishable/anon key al.
3. Authentication → URL Configuration bölümünde Site URL ve Redirect URLs alanlarına GitHub Pages URL'ini ekle. Örnek: `https://KULLANICI.github.io/REPO-ADI/`
4. Authentication → Providers → Email bölümünden e-posta doğrulamasının açık/kapalı olmasını seç. Açıksa kayıt sonrası gelen kutunu kontrol et.

## 2) GitHub'a yükleme
1. GitHub'da yeni bir repository oluştur (ör. `takipcilab`).
2. ZIP içindeki dosyaları repo köküne yükle; `.github` klasörünün de yüklendiğini kontrol et.
3. Repo → Settings → Secrets and variables → Actions → New repository secret:
   - `VITE_SUPABASE_URL` = Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase publishable/anon key
4. Repo → Settings → Pages → Build and deployment bölümünde source olarak **GitHub Actions** seç.
5. Actions sekmesinden workflow'un bitmesini bekle. Sonuç URL'i Actions/Pages bölümünde görünür.

## 3) Android'e ekleme
1. GitHub Pages URL'ini Chrome'da aç.
2. Menü (⋮) → **Ana ekrana ekle** veya **Uygulamayı yükle** seçeneğine dokun.
3. TakipçiLab simgesi ana ekranda görünür.

## Güvenlik notları
- Supabase `service_role` key'ini hiçbir zaman istemciye, GitHub Pages'a veya bu projeye koyma. Sadece publishable/anon key kullanılmalı.
- GitHub Actions secrets derleme sırasında istemci bundle'ına gömülür; publishable/anon key zaten tarayıcıda kullanılmak üzere tasarlanır. Güvenlik Supabase RLS ve Auth yapılandırmasıyla sağlanmalıdır.
- Bu ilk sürümde görev tamamlamaları, puanlar ve takipçi sayısı bu tarayıcıdaki localStorage içinde tutulur; hesaplar arasında senkronize değildir ve gerçek ödül/para değildir. Gerçek ödüller, puanların güvenilir sunucu tarafında doğrulanması ve abuse önleme için backend/Edge Function gerektirir.
- Takipçi sayısı manuel girilir; TikTok verisi otomatik çekilmez. Resmî API erişimi ayrıca onay gerektirebilir.
- Bu uygulama takipçi botu değildir; sahte etkileşim üretmez.
