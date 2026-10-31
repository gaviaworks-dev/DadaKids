/* GÖRÜNTÜLENME SAYACI (21 Eki, Beyar kararı: misafir de sayılır, botlar sayılmaz).
 *
 * Kanca: `<meta name="dada-goruntulenme" content="/goruntulenme/<tur>/<id>">` — `KabukKimligi` yalnız içeriğini
 * beyan eden detay sayfasına basar (`App\Support\Icerik\GoruntulenmeKancasi`); kancasız sayfada bu betik hiç gelmez,
 * gelirse de hiçbir şey yapmaz.
 *
 * Detay GET'i sayaca yazmaz; sayım bu tek istektir. Sayfa GÖRÜNÜR olduğunda bir kez gider: arka planda açılan sekme
 * öne gelince, ön yüklenen (prerender) sayfa etkinleşince. Aynı sayfa yaşamında ikinci kez gitmez. Ziyaretçi başına
 * günde bir tekilliği, panel kullanıcısı ve bot süzgeci sunucuda (`IcerikGoruntulemesi::kaydetNedeniyle`).
 */
(function () {
  var meta = document.querySelector('meta[name="dada-goruntulenme"]');
  var adres = meta && meta.getAttribute('content');
  if (!adres || !window.fetch) return;
  var gitti = false;

  function basliklar() {
    var b = { Accept: 'application/json' };
    var m = document.querySelector('meta[name="csrf-token"]');
    if (m && m.getAttribute('content')) {
      b['X-CSRF-TOKEN'] = m.getAttribute('content');
    } else {
      var c = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
      if (c) b['X-XSRF-TOKEN'] = decodeURIComponent(c[1]);
    }
    return b;
  }

  function gonder() {
    if (gitti || document.visibilityState !== 'visible' || document.prerendering) return;
    gitti = true;
    fetch(adres, { method: 'POST', credentials: 'same-origin', keepalive: true, headers: basliklar() })
      .catch(function () { /* ağ hatası — sessiz; bir sonraki ziyaret sayılır */ });
  }

  document.addEventListener('visibilitychange', gonder);
  document.addEventListener('prerenderingchange', gonder);
  gonder();
})();
