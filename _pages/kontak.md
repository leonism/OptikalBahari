---
layout: page
title: Hubungi Kontak Kami
subtitle:
  'Hubungi Kami Melalui Kontak Ini, Atau Untuk Respond Lebih Cepat, Silahkan MenghubungiKami Melalui
  WhatsApp Kami'
description:
  'Hubungi Kami Melalui Kontak Ini, Atau Untuk Respond Lebih Cepat, Silahkan Menghubungi Kami
  Melalui WhatsApp Kami'
keywords:
  'Lokasi, Bendungan Jago No 447, Optikal Bahari, Kemayoran, Optikal, Optik, Kacamata, Gratis'
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/bg-kontak-optikal-bahari.webp
permalink: /kontak/
comments: false
---

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 rounded">
    {% include cloudinary/card_image.html src='assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-6.webp' alt='Hubungi Optikal Bahari' ratio='16x9' class='card-img-top' %}
    <div class="card-body">
      <h3 class="card-title">Hubungi Optikal Bahari</h3>
      <p class="card-text text-start">
        Merasa bingung tentang kacamata dan pemeriksaan mata? Anda tidak sendirian, baik itu untuk pertama kali menggunakan kacamata, mengganti kacamata lama, atau sekadar melakukan pemeriksaan rutin, wajar jika Anda memiliki banyak pertanyaan. Di Optikal Bahari, kami memahami kekhawatiran dan kebingungan Anda. Itulah mengapa kami hadir sebagai mitra terpercaya untuk memberikan solusi kacamata dan kesehatan mata Anda.
      </p>
      <p class="card-text text-start">
        Dengan pengalaman lebih dari 40 tahun, kami telah membantu banyak pelanggan mendapatkan kacamata yang tepat dan pemeriksaan mata yang menyeluruh. Staff Optikal Bahari yang ramah dan profesional siap menjawab segala pertanyaan Anda dengan jelas dan informatif. Kami akan membantu Anda memahami jenis kacamata yang sesuai dengan kebutuhan dan gaya hidup Anda, serta menjelaskan berbagai pilihan lensa yang tersedia. Selain itu, kami juga menyediakan layanan pemeriksaan mata komprehensif oleh Optimetri yang berpengalaman.
      </p>
      <div class="contact-form-container">
        <form id="whatsapp-form" onsubmit="sendToWhatsApp(event)">
          <div class="form-group">
            <label for="wa-name">Nama</label>
            <input type="text" id="wa-name" class="form-control" placeholder="Nama Anda" required>
          </div>
          <div class="form-group">
            <label for="wa-needs">Kebutuhan</label>
            <select id="wa-needs" class="form-control" required>
              <option value="Tanya Kacamata">Tanya Frame Kacamata</option>
              <option value="Ganti Lensa">Ganti Lensa / Resep</option>
              <option value="Periksa Mata">Jadwal Periksa Mata</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div class="form-group">
            <label for="wa-message">Pesan</label>
            <textarea id="wa-message" class="form-control" rows="4" placeholder="Tulis pesan Anda di sini..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Kirim via WhatsApp</button>
        </form>
      </div>
      <p class="card-text text-start">
        Proses mendapatkan kacamata baru di Optikal Bahari terasa mudah dan menyenangkan. Kami menyediakan berbagai pilihan kacamata dari brand ternama dengan kualitas terbaik. Anda dapat dengan bebas mencoba berbagai model dan berkonsultasi dengan staf kami untuk mendapatkan rekomendasi. Kami juga menawarkan harga yang kompetitif dan proses pemeriksaan & service kacamata secara gratis.
      </p>
      <p class="card-text text-start">
        Tim kami yang berpengalaman siap menjawab pertanyaan Anda dengan jelas dan informatif. Kami juga akan membantu Anda memilih kacamata yang tepat sesuai dengan kebutuhan, gaya dan seputar kebubutuhan anda dalam pemakaian kacamata, atau pemeriksaan mata. Segera hubungi kami melalui pengisian kontak dibawah ini. Untuk respond yang
        lebih cepat, silahkan menghubungi kami di nomor HP/WA ini
        <a
          href="https://api.whatsapp.com/send?phone=6281932235445&text=Hallo%2C+saya+butuh+informasi+lebih+lanjut+mengenai+Optikal+Bahari"
          id="WhatsAppClick"
          class="WhatsAppCall"
          title="Call WhatsApp">+6281932235445</a>
        atau kunjungi
        <a
          href="https://www.facebook.com/optikalbahari"
          id="FBClick"
          title="Facebook Page Optikal Bahari"
          class="FacebookPage">Facebook Fan</a>
        Page kami.
        <em>(Optikal Bahari)</em>
      </p>
    </div>

  </div>
</div>

<script>
function sendToWhatsApp(event) {
  event.preventDefault(); // Prevents the page from reloading

  // 1. Get your specific WhatsApp number (Must include 62, no + or 0)
  const waNumber = "6281932235445"; // <-- CHANGE THIS TO YOUR ACTUAL WA NUMBER

  // 2. Gather the data
  const name = document.getElementById('wa-name').value;
  const needs = document.getElementById('wa-needs').value;
  const message = document.getElementById('wa-message').value;

  // 3. Format the text for WhatsApp
  const waText = `Halo Optikal Bahari, saya ${name}.\n\nSaya ingin: *${needs}*\n\nDetail:\n${message}`;

  // 4. Encode the text so spaces and enters work in the URL
  const encodedText = encodeURIComponent(waText);

  // 5. Open WhatsApp in a new tab
  const waURL = `https://wa.me/${waNumber}?text=${encodedText}`;
  window.open(waURL, '_blank');
}
</script>
