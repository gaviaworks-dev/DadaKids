/* Dada Gastro Kids — Ek gıdaya hazır mı? (sahibi: araçlar kolu) · bağımlılıksız, depolama yok */
(function () {
  'use strict';
  var form = document.getElementById('kdHazirMi');
  if (!form) return;
  var sonuc = form.querySelector('.kd-hm-sonuc');
  var sayiEl = sonuc.querySelector('[data-hm-sayi]');
  var baslikEl = sonuc.querySelector('[data-hm-baslik]');
  var metinEl = sonuc.querySelector('[data-hm-metin]');
  var erkenEl = sonuc.querySelector('[data-hm-erken]');
  var noktalar = sonuc.querySelectorAll('.kd-hm-sonuc__olcer span');
  var toplam = form.querySelectorAll('input[name="isaret"]').length;

  var METIN = {
    bos: ['İşaretledikçe sonuç burada belirir', 'Her bebek kendi hızında gelişir. İşaretler genellikle birkaç hafta içinde bir araya gelir.'],
    hepsi: ['Belirtilerin hepsi var', 'Bebeğiniz ek gıdaya hazır görünüyor. Çocuk doktorunuzla konuşup başlayabilirsiniz. İlk haftalarda amaç tanışmak; az miktar yeterli.'],
    cogu: ['Belirtilerin çoğu var', 'Çocuk doktorunuzla konuşup başlayabilirsiniz. Eksik işaret çoğu zaman birkaç gün ya da hafta içinde gelir.'],
    erken: ['Henüz erken olabilir', 'Birkaç işaret daha bir araya geldiğinde yeniden bakın. Bu sürede süt ana besin olmaya devam eder; acele etmeye gerek yok.'],
    ay: ['Henüz erken olabilir', 'Genel öneri, ek gıdaya 6. ay civarında başlamaktır. Daha erken başlamayı düşünüyorsanız önce çocuk doktorunuzla konuşun.']
  };

  function guncelle() {
    var secili = form.querySelectorAll('input[name="isaret"]:checked');
    var n = secili.length;
    var ay = form.querySelector('#hm-ay').checked;
    var durum = n === 0 ? 'bos' : !ay ? 'ay' : n === toplam ? 'hepsi' : n >= toplam - 1 ? 'cogu' : 'erken';
    sonuc.setAttribute('data-durum', durum);
    sayiEl.textContent = String(n);
    baslikEl.textContent = METIN[durum][0];
    metinEl.textContent = METIN[durum][1];
    for (var i = 0; i < noktalar.length; i++) noktalar[i].classList.toggle('kd-dolu', i < n);
    erkenEl.hidden = !form.querySelector('#hm-erken').checked;
  }
  form.addEventListener('change', guncelle);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  guncelle();
})();
