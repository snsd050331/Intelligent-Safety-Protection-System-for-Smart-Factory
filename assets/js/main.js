/*
	Projection by TEMPLATED
	templated.co @templatedco
	Released for free under the Creative Commons Attribution 3.0 license (templated.co/license)
*/

(function($) {

	// Breakpoints.
		skel.breakpoints({
			xlarge:	'(max-width: 1680px)',
			large:	'(max-width: 1280px)',
			medium:	'(max-width: 980px)',
			small:	'(max-width: 736px)',
			xsmall:	'(max-width: 480px)'
		});

	$(function() {

		var	$window = $(window),
			$body = $('body');

		// Disable animations/transitions until the page has loaded.
			$body.addClass('is-loading');

			$window.on('load', function() {
				window.setTimeout(function() {
					$body.removeClass('is-loading');
				}, 100);
			});

		// Prioritize "important" elements on medium.
			skel.on('+medium -medium', function() {
				$.prioritize(
					'.important\\28 medium\\29',
					skel.breakpoint('medium').active
				);
			});

	// Off-Canvas Navigation.

		// Navigation Panel.
			$(
				'<div id="navPanel">' +
					$('#nav').html() +
					'<a href="#navPanel" class="close"></a>' +
				'</div>'
			)
				.appendTo($body)
				.panel({
					delay: 500,
					hideOnClick: true,
					hideOnSwipe: true,
					resetScroll: true,
					resetForms: true,
					side: 'left'
				});

		// Login Modal.
			var $loginModal = $('#loginModal');

			if ($loginModal.length > 0) {

				var $loginPrimaryInput = $loginModal.find('#login-username'),
					$lastLoginTrigger = null,
					$loginForm = $loginModal.find('form'),
					$message = $loginModal.find('.form-message'),
					$submitButton = $loginForm.find('input[type="submit"]'),
					setMessage = function(text, isError) {
						if (!$message.length)
							return;

						$message
							.toggleClass('error', !!isError)
							.text(text || '');
					},
					closeNavPanel = function() {
						var $navPanel = $('#navPanel');

						if ($navPanel.length && typeof $navPanel.panel === 'function')
							$navPanel.panel('hide');
					},
					openLogin = function($trigger) {
						$lastLoginTrigger = $trigger || null;
						setMessage('');
						$body.addClass('is-login-visible');
						$loginModal.attr('aria-hidden', 'false');

						window.setTimeout(function() {
							$loginPrimaryInput.focus();
						}, 100);
					},
					closeLogin = function() {
						setMessage('');
						if ($loginForm.length)
							$loginForm[0].reset();

						$body.removeClass('is-login-visible');
						$loginModal.attr('aria-hidden', 'true');

						window.setTimeout(function() {
							if ($lastLoginTrigger && $lastLoginTrigger.length)
								$lastLoginTrigger.focus();

							$lastLoginTrigger = null;
						}, 100);
					},
					setSubmitting = function(isSubmitting) {
						if ($submitButton.length)
							$submitButton.prop('disabled', isSubmitting).toggleClass('is-loading', isSubmitting);

						$loginForm.toggleClass('is-submitting', isSubmitting);
					};

				$(document).on('click', '.login-link', function(event) {
					event.preventDefault();
					closeNavPanel();
					openLogin($(this));
				});

				$loginModal.on('click', function(event) {
					if ($(event.target).is('#loginModal'))
						closeLogin();
				});

				$loginModal.on('click', '.modal-close', function(event) {
					event.preventDefault();
					closeLogin();
				});

				$(document).on('keyup', function(event) {
					if (event.key === 'Escape' && $body.hasClass('is-login-visible'))
						closeLogin();
				});

				$loginForm.on('submit', function(event) {
					var $passwordInput;

					event.preventDefault();
					setMessage('');

					$passwordInput = $loginModal.find('#login-password');

					var username = $.trim($loginPrimaryInput.val()),
						password = $.trim($passwordInput.val());

					if (!username || !password) {
						setMessage('請完整輸入帳號與密碼。', true);
						return;
					}

					setSubmitting(true);

					var API_BASE = (window.AUTH_API_BASE !== undefined && window.AUTH_API_BASE !== null)
						? String(window.AUTH_API_BASE).replace(/\/$/, '')
						: (location.port === '3000' ? '' : 'http://localhost:3000');

					fetch(API_BASE + '/api/login', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ username: username, password: password })
					})
						.then(function(response) {
							if (!response.ok)
								return response.json().then(function(body) { throw body; });
							return response.json();
						})
						.then(function(body) {
							setMessage(body && body.message ? body.message : '登入成功！', false);

							window.setTimeout(function() {
								closeLogin();
							}, 1000);
						})
						.catch(function(err) {
							var errorText = (err && err.error) ? err.error : '登入失敗，請稍後再試。';
							setMessage(errorText, true);
						})
						.finally(function() {
							setSubmitting(false);
						});
				});

			}

		// Fix: Remove transitions on WP<10 (poor/buggy performance).
			if (skel.vars.os == 'wp' && skel.vars.osVersion < 10)
				$('#navPanel')
					.css('transition', 'none');

		// Project detail loader for Get Started page.
			var $detailPanel = $('.detail-panel');

			if ($detailPanel.length) {
				var projectCache = {};

				var runProjectHook = function(view, rootNode) {
					if (!window.ProjectViews || typeof window.ProjectViews[view] !== 'function')
						return;

					try {
						window.ProjectViews[view](rootNode);
					} catch (err) {
						console.error('Project view init failed for', view, err);
					}
				};

				$(document).on('click', '.project-link[data-view]', function(event) {
					var $link = $(this);
					var view = $.trim($link.data('view'));

					event.preventDefault();

					if (!view)
						return;

					$('.project-link.is-active').removeClass('is-active');
					$link.addClass('is-active');

					if (projectCache.hasOwnProperty(view)) {
						$detailPanel.html(projectCache[view]);
						runProjectHook(view, $detailPanel.get(0));
						return;
					}

					$detailPanel
						.attr('aria-busy', 'true')
						.html('<p>資料載入中...</p>');

					$.get('partials/' + view + '.html')
						.done(function(markup) {
							projectCache[view] = markup || '';
							$detailPanel.html(projectCache[view] || '<p>目前沒有可顯示的內容。</p>');
							runProjectHook(view, $detailPanel.get(0));
						})
						.fail(function() {
							$detailPanel.html('<p>無法載入專案內容，請稍候再試。</p>');
						})
						.always(function() {
							$detailPanel.removeAttr('aria-busy');
						});
				});

				var $initialLink = $('.project-link[data-view]').first();
				if ($initialLink.length)
					$initialLink.trigger('click');
			}

	});

})(jQuery);



