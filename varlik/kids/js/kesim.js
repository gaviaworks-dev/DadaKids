/* Dada Gastro Kids — Güvenli Kesim: canlı arama (Türkçe duyarsız) + grup / risk süzgeci + #besin bağlantıları */
(function () {
  'use strict';
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  var liste = $('#kesim-liste');
  if (!liste) return;
  var kartlar = $$('.kd-kesim', liste);
  var girdi = $('#kesim-ara');
  var sayi = $('#kesim-sayi');
  var temizle = $('#kesim-temizle');
  var bos = $('#kesim-bos');
  var durum = { q: '', grup: '', risk: '' };

  // kesim.mjs'teki normal() ile aynı kural
  function normal(s) {
    return String(s || '').toLocaleLowerCase('tr')
      .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u').replace(/\s+/g, ' ').trim();
  }

  function uygula() {
    var parcalar = normal(durum.q).split(' ').filter(Boolean);
    var n = 0;
    kartlar.forEach(function (k) {
      var ara = k.getAttribute('data-ara') || '';
      var tamam = (!durum.grup || k.getAttribute('data-grup') === durum.grup) &&
        (!durum.risk || k.getAttribute('data-risk') === durum.risk) &&
        parcalar.every(function (p) { return ara.indexOf(p) !== -1; });
      k.hidden = !tamam;
      if (tamam) n++;
    });
    if (sayi) sayi.textContent = String(n);
    var filtreli = !!(durum.q || durum.grup || durum.risk);
    if (temizle) temizle.hidden = !filtreli;
    if (bos) {
      bos.hidden = n > 0;
      var oneri = $('.kd-bos__oneriler', bos);
      if (oneri && n === 0) {
        oneri.innerHTML = '';
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'kd-btn kd-btn--kucuk';
        btn.textContent = 'Filtreleri temizle';
        btn.addEventListener('click', sifirla);
        oneri.appendChild(btn);
      }
    }
  }

  function chipSec(grupAdi, deger) {
    $$('[data-kd-filtre="' + grupAdi + '"] .kd-chip').forEach(function (c) {
      c.setAttribute('aria-pressed', String((c.getAttribute('data-' + grupAdi) || '') === deger));
    });
  }

  function sifirla() {
    durum = { q: '', grup: '', risk: '' };
    if (girdi) girdi.value = '';
    chipSec('grup', ''); chipSec('risk', '');
    uygula();
  }

  if (girdi) {
    girdi.addEventListener('input', function () { durum.q = girdi.value; uygula(); });
    girdi.addEventListener('keydown', function (e) { if (e.key === 'Escape') { girdi.value = ''; durum.q = ''; uygula(); } });
  }
  ['grup', 'risk'].forEach(function (ad) {
    $$('[data-kd-filtre="' + ad + '"] .kd-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        var d = c.getAttribute('data-' + ad) || '';
        durum[ad] = durum[ad] === d ? '' : d;
        chipSec(ad, durum[ad]);
        uygula();
      });
    });
  });
  if (temizle) temizle.addEventListener('click', sifirla);

  // #besin: kart süzgeç yüzünden gizliyse önce süzgeci temizle, sonra kaydır ve vurgula
  function hedefeGit(yumusak) {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var k = document.getElementById(id);
    if (!k) return;
    var azaltH = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // kart dışı çapalar (#atlas, #bogulma-bas): yapışkan menünün altına hizala (scroll-margin)
    if (!k.classList.contains('kd-kesim')) { if (k.closest('.kd-sayfa')) k.scrollIntoView({ behavior: yumusak && !azaltH ? 'smooth' : 'instant', block: 'start' }); return; }
    if (k.hidden) sifirla();
    var d = $('.kd-kdizin[open]'); if (d && yumusak) d.open = false;
    k.classList.add('kd-gorundu');
    var azalt = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    k.scrollIntoView({ behavior: yumusak && !azalt ? 'smooth' : 'instant', block: 'start' });
    kartlar.forEach(function (x) { x.classList.remove('kd-hedef'); });
    k.classList.add('kd-hedef');
  }
  window.addEventListener('hashchange', function () { hedefeGit(true); });
  if (location.hash) { setTimeout(function () { hedefeGit(false); }, 60); window.addEventListener('load', function () { setTimeout(function () { hedefeGit(false); }, 120); }); }
})();
