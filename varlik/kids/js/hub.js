/* kids.html — "Bu ay tezgâhta" bölümünde bu ayı göster (sahibi: lead) */
(function () {
  var kap = document.querySelector('[data-kd-bu-ay]'); if (!kap) return;
  var ay = new Date().getMonth() + 1;
  var paneller = kap.querySelectorAll('.kd-hub-ay');
  var var_ = false;
  paneller.forEach(function (p) { var bu = +p.dataset.ay === ay; p.hidden = !bu; if (bu) var_ = true; });
  if (!var_ && paneller[0]) paneller[0].hidden = false;
})();

/* kids.html — sağ kolonda seçili evrenin tarifleri; tarifi olmayan evrede (hamilelik, 0–6 ay) ilk tarifler görünür */
(function () {
  var kap = document.querySelector('[data-kd-evre-oneri]'), form = document.querySelector('.kd-profil__form');
  if (!kap || !form) return;
  var listeler = kap.querySelectorAll('.kd-hub-oneri__liste'), baslik = kap.querySelector('[data-kd-oneri-baslik]');
  function goster() {
    var s = form.querySelector('input[name="evre"]:checked'), evre = s ? s.value : '', var_ = false;
    listeler.forEach(function (l) { var bu = l.getAttribute('data-evre') === evre; l.hidden = !bu; if (bu) var_ = true; });
    if (!var_ && listeler[0]) listeler[0].hidden = false;
    baslik.textContent = baslik.getAttribute(var_ ? 'data-var' : 'data-yok');
  }
  form.addEventListener('change', goster);
  goster();
})();
