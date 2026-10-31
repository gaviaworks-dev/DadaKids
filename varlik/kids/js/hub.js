/* kids.html — "Bu ay tezgâhta" bölümünde bu ayı göster (sahibi: lead) */
(function () {
  var kap = document.querySelector('[data-kd-bu-ay]'); if (!kap) return;
  var ay = new Date().getMonth() + 1;
  var paneller = kap.querySelectorAll('.kd-hub-ay');
  var var_ = false;
  paneller.forEach(function (p) { var bu = +p.dataset.ay === ay; p.hidden = !bu; if (bu) var_ = true; });
  if (!var_ && paneller[0]) paneller[0].hidden = false;
})();
