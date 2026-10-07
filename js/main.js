(function () {
	'use strict';

	var body = document.body;
	var header = document.getElementById('gHeader');
	var menuBtn = document.querySelector('#gHeader .menu');
	var menuBox = document.getElementById('menuBox');
	var pageTop = document.querySelector('.pageTop');
	var scrollPos = 0;
	var isOpen = false;

	/*------------------------------------------------------------
		メニュー（PC・SP 共通。開いている間は背景のスクロールを止める）
	------------------------------------------------------------*/
	function openMenu() {
		scrollPos = window.scrollY;
		body.classList.add('fixed');
		body.style.top = -scrollPos + 'px';
		menuBtn.classList.add('on');
		menuBox.classList.add('on');
		menuBtn.setAttribute('aria-expanded', 'true');
		menuBtn.setAttribute('aria-label', 'メニューを閉じる');
		isOpen = true;
	}
	function closeMenu() {
		body.classList.remove('fixed');
		body.style.top = '';
		window.scrollTo({ top: scrollPos, behavior: 'instant' });
		menuBtn.classList.remove('on');
		menuBox.classList.remove('on');
		menuBtn.setAttribute('aria-expanded', 'false');
		menuBtn.setAttribute('aria-label', 'メニューを開く');
		isOpen = false;
	}
	if (menuBtn && menuBox) {
		menuBtn.addEventListener('click', function () {
			isOpen ? closeMenu() : openMenu();
		});
		menuBox.querySelectorAll('a:not([href^="tel:"])').forEach(function (a) {
			a.addEventListener('click', closeMenu);
		});
		document.addEventListener('keydown', function (e) {
			if (isOpen && e.key === 'Escape') closeMenu();
		});
	}

	/*------------------------------------------------------------
		ページ内リンク：固定ヘッダーの高さ分ずらしてスクロール
	------------------------------------------------------------*/
	document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (a) {
		a.addEventListener('click', function (e) {
			var target = document.querySelector(a.getAttribute('href'));
			if (!target) return;
			e.preventDefault();
			var offset = target.id === 'container' ? 0 : header.offsetHeight;
			requestAnimationFrame(function () {
				var top = target.getBoundingClientRect().top + window.scrollY - offset;
				window.scrollTo({ top: top, behavior: 'smooth' });
			});
		});
	});

	/*------------------------------------------------------------
		MV：写真のクロスフェード（4秒表示 → 1.2秒でフェード。Figma の After Delay 4000ms / 1.2s と同じ）
	------------------------------------------------------------*/
	var slide = document.querySelector('.js-mvSlide');
	if (slide) {
		var imgs = slide.querySelectorAll('img');
		var current = 0;
		if (imgs.length > 1) {
			setInterval(function () {
				imgs[current].classList.remove('is-active');
				current = (current + 1) % imgs.length;
				imgs[current].classList.add('is-active');
			}, 5200);
		}
	}

	/*------------------------------------------------------------
		固定 CTA の切り替え（PC）
		MV の下端が FV-CTA の下端より上に来たら、FV-CTA → MV 以降 CTA（右端のタブ）に切り替える
		SP は CSS で画面下部に常に表示
	------------------------------------------------------------*/
	var mv = document.getElementById('mv');
	var fvCta = document.getElementById('fvCta');
	var sideCta = document.getElementById('sideCta');
	function toggleCta() {
		if (!sideCta) return;
		var afterMv = true;
		if (mv && fvCta) {
			afterMv = mv.getBoundingClientRect().bottom < fvCta.getBoundingClientRect().bottom;
			fvCta.classList.toggle('hide', afterMv);
		}
		sideCta.classList.toggle('show', afterMv);
	}

	/*------------------------------------------------------------
		英字テキストの無限ループ
		1組（文を n 個）の幅が画面幅以上になるよう複製し、同じ組を2つ並べて CSS で -50% 流す。
		文1つあたりの秒数を保つので、文の数が増えても流れる速さは同じ
	------------------------------------------------------------*/
	var loopTrack = document.querySelector('.js-loopTrack');
	var loopSrc = loopTrack ? loopTrack.querySelector('p') : null;
	var loopW = 0;
	function buildLoop() {
		if (!loopTrack || !loopSrc) return;
		var vw = document.documentElement.clientWidth;
		if (vw === loopW) return;
		loopW = vw;
		loopTrack.innerHTML = '';
		loopTrack.appendChild(loopSrc);
		var unit = loopSrc.getBoundingClientRect().width || 1;
		var n = Math.max(1, Math.ceil(vw / unit));
		for (var i = 1; i < n * 2; i++) {
			loopTrack.appendChild(loopSrc.cloneNode(true));
		}
		var secPerText = window.matchMedia('(max-width: 896px)').matches ? 25 : 40;
		loopTrack.style.animationDuration = (secPerText * n) + 's';
	}
	buildLoop();
	window.addEventListener('resize', buildLoop);
	if (document.fonts) document.fonts.ready.then(function () { loopW = 0; buildLoop(); });

	/*------------------------------------------------------------
		全国対応ネットワーク：エリアカードにホバーすると地図の該当地域を青くする（PC のみ）
	------------------------------------------------------------*/
	var mapHls = document.querySelectorAll('.netMap .hl');
	document.querySelectorAll('.netArea li').forEach(function (li) {
		var area = li.getAttribute('data-area');
		var link = li.querySelector('a');
		function toggle(on) {
			if (on && !window.matchMedia('(min-width: 897px)').matches) return;
			mapHls.forEach(function (img) {
				img.classList.toggle('is-active', on && img.getAttribute('data-area') === area);
			});
		}
		link.addEventListener('mouseenter', function () { toggle(true); });
		link.addEventListener('mouseleave', function () { toggle(false); });
		link.addEventListener('focus', function () { toggle(true); });
		link.addEventListener('blur', function () { toggle(false); });
	});

	/*------------------------------------------------------------
		タブ切替（製品ラインナップ）。←→ キーでも切り替えられる
	------------------------------------------------------------*/
	document.querySelectorAll('.js-tabs').forEach(function (wrap) {
		var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
		function select(tab, focus) {
			tabs.forEach(function (t) {
				var on = t === tab;
				var panel = document.getElementById(t.getAttribute('aria-controls'));
				t.classList.toggle('is-active', on);
				t.setAttribute('aria-selected', on ? 'true' : 'false');
				t.tabIndex = on ? 0 : -1;
				if (panel) panel.classList.toggle('is-active', on);
			});
			if (focus) tab.focus();
		}
		tabs.forEach(function (tab, i) {
			tab.addEventListener('click', function () { select(tab); });
			tab.addEventListener('keydown', function (e) {
				var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
				if (!d) return;
				e.preventDefault();
				select(tabs[(i + d + tabs.length) % tabs.length], true);
			});
		});
	});

	/*------------------------------------------------------------
		コンテンツ一覧のカルーセル（中央拡大・ループ）
		現在のカードを中央に、前後を左右に置く。それ以外は左右の位置で透明にしておき、
		移動時にフェードで出入りさせる（Figma のプロトタイプと同じ動き）。SP はスワイプでも動く
	------------------------------------------------------------*/
	document.querySelectorAll('.js-ctSlider').forEach(function (slider) {
		var cards = Array.prototype.slice.call(slider.querySelectorAll('.ctCard'));
		var n = cards.length;
		var current = 0;
		var CLASSES = ['is-left', 'is-center', 'is-right', 'is-outL', 'is-outR'];
		function render() {
			cards.forEach(function (card, i) {
				var d = (i - current + n) % n; // 0:中央 1:右 n-1:左
				var cls = d === 0 ? 'is-center' : d === 1 ? 'is-right' : d === n - 1 ? 'is-left' : d <= n / 2 ? 'is-outR' : 'is-outL';
				CLASSES.forEach(function (c) { card.classList.toggle(c, c === cls); });
				var link = card.querySelector('a');
				var visible = cls === 'is-left' || cls === 'is-center' || cls === 'is-right';
				link.tabIndex = visible ? 0 : -1;
				card.setAttribute('aria-hidden', visible ? 'false' : 'true');
			});
		}
		function go(step) {
			current = (current + step + n) % n;
			render();
		}
		slider.querySelector('.ctArrow.prev').addEventListener('click', function () { go(-1); });
		slider.querySelector('.ctArrow.next').addEventListener('click', function () { go(1); });
		// 左右のカードをクリックしたら、リンクには飛ばずにそのカードを中央へ
		cards.forEach(function (card) {
			card.querySelector('a').addEventListener('click', function (e) {
				if (card.classList.contains('is-left')) { e.preventDefault(); go(-1); }
				if (card.classList.contains('is-right')) { e.preventDefault(); go(1); }
			});
		});
		var startX = null;
		slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
		slider.addEventListener('touchend', function (e) {
			if (startX === null) return;
			var dx = e.changedTouches[0].clientX - startX;
			if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
			startX = null;
		});
		render();
		requestAnimationFrame(function () {
			requestAnimationFrame(function () { slider.classList.add('is-ready'); });
		});
	});

	/*------------------------------------------------------------
		文化シヤッターグループのスライダー（ループ）
		元のカードの前後に複製を1組ずつ置き、--pos（左から何枚目を中央にするか）を変えて動かす。
		複製側まで行ったら、移動が終わった瞬間にアニメなしで元の側へ戻す
		4秒ごとに自動で次へ（hover 中・画面外では停止）
	------------------------------------------------------------*/
	document.querySelectorAll('.js-grpSlider').forEach(function (slider) {
		var track = slider.querySelector('.grpTrack');
		var originals = Array.prototype.slice.call(track.children);
		var n = originals.length;
		var dotsWrap = slider.querySelector('.grpDots');
		var current = 0;
		// 複製（読み上げ・タブ移動の対象外にする）
		function clone(li) {
			var c = li.cloneNode(true);
			c.setAttribute('aria-hidden', 'true');
			c.querySelector('a').tabIndex = -1;
			return c;
		}
		originals.slice().reverse().forEach(function (li) { track.insertBefore(clone(li), track.firstChild); });
		originals.forEach(function (li) { track.appendChild(clone(li)); });
		// ドットを枚数に合わせて作り直す
		dotsWrap.innerHTML = '';
		originals.forEach(function (li, i) {
			var b = document.createElement('button');
			b.type = 'button';
			b.setAttribute('aria-label', (i + 1) + '枚目');
			b.addEventListener('click', function () { move(i - current); });
			dotsWrap.appendChild(b);
		});
		var dots = dotsWrap.querySelectorAll('button');
		var pos = n; // 元の1枚目
		function apply(animate) {
			slider.classList.toggle('is-ready', animate);
			track.style.setProperty('--pos', pos);
			current = ((pos - n) % n + n) % n;
			dots.forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
		}
		function move(step) {
			if (!step) return;
			pos += step;
			apply(true);
			restart();
		}
		// 自動スライド：4秒ごとに次へ。マウスが乗っている間・画面外・タブ非表示のときは止める（OS の動きを減らす設定では止めない）。
		// 矢印・ドット・スワイプで動かしたら、そこから4秒数え直す
		var AUTO_MS = 4000;
		var timer = null;
		var hovering = false;
		var inView = false;
		function stop() {
			clearInterval(timer);
			timer = null;
		}
		function restart() {
			stop();
			if (hovering || !inView || document.hidden) return;
			timer = setInterval(function () {
				pos += 1;
				apply(true);
			}, AUTO_MS);
		}
		// スマホはタップで mouseenter が起きて止まったままになるので、hover できる端末だけ
		if (window.matchMedia('(hover: hover)').matches) {
			slider.addEventListener('mouseenter', function () { hovering = true; stop(); });
			slider.addEventListener('mouseleave', function () { hovering = false; restart(); });
		}
		slider.addEventListener('focusin', function () { hovering = true; stop(); });
		slider.addEventListener('focusout', function () { hovering = false; restart(); });
		document.addEventListener('visibilitychange', restart);
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				inView = entries[0].isIntersecting;
				restart();
			}).observe(slider);
		} else {
			inView = true;
		}
		track.addEventListener('transitionend', function (e) {
			if (e.target !== track) return;
			if (pos < n || pos >= n * 2) {
				pos = n + current;
				apply(false);
			}
		});
		slider.querySelector('.grpArrow.prev').addEventListener('click', function () { move(-1); });
		slider.querySelector('.grpArrow.next').addEventListener('click', function () { move(1); });
		var startX = null;
		track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
		track.addEventListener('touchend', function (e) {
			if (startX === null) return;
			var dx = e.changedTouches[0].clientX - startX;
			if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
			startX = null;
		});
		apply(false);
		restart();
	});

	/*------------------------------------------------------------
		背景エリアの色（スクロール連動）
		- 白の濃さ：エリア上端 0.8 → お問い合わせフローの手前 0.89（Figma のグラデと同じ）
		  → お問い合わせフローが画面下から中央に来るまでに 1（白ベタ）へ徐々に
		- data-bg-from の色：そのセクションの上端が画面の 60% の高さまで来たら表示（CSS で 1 秒フェード）
	------------------------------------------------------------*/
	var gradArea = document.querySelector('.js-gradArea');
	var gradBg = document.querySelector('.js-gradBg');
	var flowSec = document.getElementById('flow');
	var gradColors = gradBg ? Array.prototype.slice.call(gradBg.querySelectorAll('.gradColor')) : [];
	function whiteAlpha(y, flowTop, vh) {
		// y：エリア上端からの距離（px）
		if (y <= flowTop - vh) return 0.8 + 0.09 * Math.max(0, y) / Math.max(1, flowTop - vh);
		if (y >= flowTop - vh / 2) return 1;
		return 0.89 + 0.11 * (y - (flowTop - vh)) / (vh / 2);
	}
	function updateBg() {
		if (!gradArea || !gradBg) return;
		var areaTop = gradArea.getBoundingClientRect().top;
		var vh = window.innerHeight;
		var flowTop = flowSec ? flowSec.getBoundingClientRect().top - areaTop : 0;
		var yTop = -areaTop;
		gradBg.style.setProperty('--bg-top', whiteAlpha(yTop, flowTop, vh).toFixed(3));
		gradBg.style.setProperty('--bg-bottom', whiteAlpha(yTop + vh, flowTop, vh).toFixed(3));
		gradColors.forEach(function (layer) {
			var sec = document.getElementById(layer.getAttribute('data-bg-from'));
			layer.classList.toggle('is-on', !!sec && sec.getBoundingClientRect().top < vh * 0.6);
		});
	}

	/*------------------------------------------------------------
		ページトップボタンの表示
	------------------------------------------------------------*/
	function togglePageTop() {
		if (!pageTop) return;
		pageTop.classList.toggle('show', window.scrollY > 300);
	}

	var ticking = false;
	function onScroll() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function () {
			toggleCta();
			updateBg();
			togglePageTop();
			ticking = false;
		});
	}
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);
	onScroll();

	/*------------------------------------------------------------
		スクロールアニメーション
		- .js-fade / .js-band / .js-secTtl が画面に入ったら .is-inview を付ける（1回だけ）
		- .js-fadeGroup の中の .js-fade は 0.12 秒ずつ（data-stagger で変更可）遅らせて順番に表示（左から時間差でふわっと）
		- data-trigger="group" のグループは PC ではグループが画面に入った時点でまとめて開始（横並びのカードを左から順に出す）
	------------------------------------------------------------*/
	var isPc = window.matchMedia('(min-width: 897px)').matches;
	var groupTargets = []; // まとめて表示するグループ（PC の横並び。data-trigger="group"）
	document.querySelectorAll('.js-fadeGroup').forEach(function (group) {
		var step = parseFloat(group.getAttribute('data-stagger')) || 0.12;
		var items = group.querySelectorAll('.js-fade');
		// SP で縦積みになるグループ（data-trigger="group"）は、1枚ずつ画面に入ったときに出すので遅延なし
		if (!isPc && group.getAttribute('data-trigger') === 'group') return;
		items.forEach(function (el, i) {
			if (!el.style.getPropertyValue('--delay')) el.style.setProperty('--delay', (i * step) + 's');
		});
		if (isPc && group.getAttribute('data-trigger') === 'group') {
			items.forEach(function (el) { el.classList.add('js-fadeByGroup'); });
			groupTargets.push(group);
		}
	});
	var targets = document.querySelectorAll('.js-fade:not(.js-fadeByGroup), .js-band, .js-secTtl');
	if ('IntersectionObserver' in window) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var el = entry.target;
				if (el.classList.contains('js-fadeGroup')) {
					// グループが画面に入ったら、中の要素を左から順に（--delay の時間差で）表示
					el.querySelectorAll('.js-fade').forEach(function (item) { item.classList.add('is-inview'); });
				} else {
					el.classList.add('is-inview');
				}
				io.unobserve(el);
			});
		}, { rootMargin: '0px 0px -15% 0px' });
		targets.forEach(function (el) { io.observe(el); });
		groupTargets.forEach(function (el) { io.observe(el); });
	} else {
		document.querySelectorAll('.js-fade, .js-band, .js-secTtl').forEach(function (el) { el.classList.add('is-inview'); });
	}
})();
