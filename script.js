document.addEventListener('DOMContentLoaded', function() {
    // --- Управление модальным окном Cookie ---
    const cookieModal = document.getElementById('cookie-modal-overlay');
    const acceptCookieBtn = document.getElementById('cookie-accept-btn');
    if (cookieModal && acceptCookieBtn) {
        if (!localStorage.getItem('cookieConsent')) {
            cookieModal.classList.add('active');
        }
        acceptCookieBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'true');
            cookieModal.classList.remove('active');
        });
    }

    // ▼▼▼ Блок для меню ▼▼▼
    // --- Логика бургер-меню ---
    const burgerMenu = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links li a');
    const body = document.body;

    if (burgerMenu && navLinks) {
        burgerMenu.addEventListener('click', () => {
            burgerMenu.classList.toggle('active');
            navLinks.classList.toggle('open');
            body.classList.toggle('noscroll');
        });

        // Закрываем меню при клике на ссылку (для якорей)
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('open')) {
                    burgerMenu.classList.remove('active');
                    navLinks.classList.remove('open');
                    body.classList.remove('noscroll');
                }
            });
        });
    }
    // ▲▲▲ Конец блока меню ▲▲▲

    // --- Логика отправки формы (через send.php на своём сервере) ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';

            try {
                const response = await fetch('send.php', {
                    method: 'POST',
                    body: new FormData(contactForm)
                });

                if (response.redirected) {
                    window.location.href = response.url;
                    return;
                }

                const text = await response.text();
                if (response.ok) {
                    window.location.href = 'thankyou.html';
                } else {
                    alert(text || 'Произошла ошибка. Позвоните нам: +7 (982) 623-17-74');
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            } catch (error) {
                console.error('Ошибка при отправке формы:', error);
                alert('Не удалось отправить заявку. Позвоните нам: +7 (982) 623-17-74');
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    // --- Отслеживание кликов по виджетам соцсетей ---
    const tgLink = document.getElementById('tg-widget-link');
    const waLink = document.getElementById('wa-widget-link');

    if (tgLink) {
        tgLink.addEventListener('click', function() {
            ym(104165339, 'reachGoal', 'click-tg');
            console.log('Цель достигнута: click-tg'); // Для проверки в консоли
        });
    }

    if (waLink) {
        waLink.addEventListener('click', function() {
            ym(104165339, 'reachGoal', 'click-wa');
            console.log('Цель достигнута: click-wa'); // Для проверки в консоли
        });
    }
    // ▲▲▲ Конец блока ▲▲▲
});
