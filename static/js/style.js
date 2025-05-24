function openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
}

const volumeSlider = document.getElementById('volume');
const volumeIcon = document.querySelector('.volume-icon');

volumeSlider.addEventListener('input', () => {
  const volume = volumeSlider.value;
  localStorage.setItem('volume', volume);

  // (opsional) update ikon sesuai volume
  const volumeIcon = document.querySelector('.volume-icon');
  if (volume == 0) volumeIcon.textContent = '🔇';
  else if (volume < 50) volumeIcon.textContent = '🔈';
  else volumeIcon.textContent = '🔊';
});

window.addEventListener('load', () => {
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
      volumeSlider.value = savedVolume;
      volumeSlider.dispatchEvent(new Event('input')); // trigger icon update
    }
  });

window.addEventListener('click', function(event) {
    const modal = document.getElementById('settingsModal');
    const content = document.querySelector('.modal-content');
  
    if (event.target === modal) {
      modal.style.display = 'none';
    }
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('login-popup');
  
    if (event.target === modal) {
      modal.style.display = 'none';
    }
});

function showHelpTab(level) {
  const content = document.getElementById("help-tab-content");

  if (level === "beginner") {
    content.innerHTML = `
      <h4>Level Pemula - <i>Data Valley</i></h4>
      <p>Fokus pada dasar pemrograman Python:</p>
      <ul>
        <li><b>Variabel:</b> Menyimpan nilai</li>
        <li><b>Tipe Data:</b> <code>int</code>, <code>str</code>, <code>bool</code></li>
        <li><b>Fungsi Print:</b> Tampilkan output ke layar</li>
        <li><b>Contoh:</b></li>
      </ul>
      <pre><code class="language-python">
umur = 25
nama = "Budi"
is_siswa = True
print(nama, umur)
      </code></pre>
      <p>Gunakan perintah <code>move.up(x)</code> untuk bergerak.</p>
    `;
  } else if (level === "intermediate") {
    content.innerHTML = `
      <h4>Level Menengah - <i>Logic Mountain</i></h4>
      <p>Fokus pada struktur kontrol logika:</p>
      <ul>
        <li><b>If-Else:</b> Pengambilan keputusan</li>
        <li><b>Perbandingan:</b> <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;=</code></li>
        <li><b>Logika:</b> <code>and</code>, <code>or</code>, <code>not</code></li>
        <li><b>Contoh:</b></li>
      </ul>
      <pre><code class="language-python">
nilai = 80
if nilai >= 75:
    print("Lulus")
else:
    print("Tidak lulus")
      </code></pre>
      <p>Hindari rintangan batu besar dan berpikir logis!</p>
    `;
  } else if (level === "advanced") {
    content.innerHTML = `
      <h4>Level Lanjutan - <i>Algorithm Forest</i></h4>
      <p>Fokus pada algoritma dan efisiensi kode:</p>
      <ul>
        <li><b>Perulangan:</b> <code>for</code>, <code>while</code></li>
        <li><b>Fungsi:</b> Buat blok kode modular</li>
        <li><b>Optimasi:</b> Cegah perulangan tak terbatas</li>
        <li><b>Contoh:</b></li>
      </ul>
      <pre><code class="language-python">
def hitung_faktorial(n):
    hasil = 1
    for i in range(1, n+1):
        hasil *= i
    return hasil

print(hitung_faktorial(5))
      </code></pre>
      <p>Gunakan pendekatan algoritma yang efisien.</p>
    `;
  }

  // Aktifkan highlight Prism jika digunakan
  if (typeof Prism !== 'undefined') {
    Prism.highlightAll();
  }
}

function openHelp() {
    const level = localStorage.getItem("selectedDifficulty") || "beginner";
    showHelpTab(level);
    document.getElementById("help-popup").style.display = "flex";
  }

window.addEventListener('click', function(event) {
    const modal = document.getElementById("help-popup");
  
    if (event.target === modal) {
      modal.style.display = 'none';
    }
});