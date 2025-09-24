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

    // --- Управление модальным окном уведомлений (для ошибок) ---
    const notificationOverlay = document.getElementById('notification-overlay');
    const closeNotificationBtn = document.getElementById('notification-close-btn');
    if (notificationOverlay && closeNotificationBtn) {
        const closeNotification = () => notificationOverlay.classList.remove('visible');
        closeNotificationBtn.addEventListener('click', closeNotification);
        notificationOverlay.addEventListener('click', (e) => {
            if (e.target === notificationOverlay) {
                closeNotification();
            }
        });
    }

    function showNotification(title, message, isSuccess = true) {
        if (!notificationOverlay) return;
        const modal = notificationOverlay.querySelector('.notification-modal');
        const iconEl = modal.querySelector('.icon');
        const titleEl = modal.querySelector('h3');
        const messageEl = modal.querySelector('p');
        titleEl.textContent = title;
        messageEl.innerHTML = message;
        if (isSuccess) {
            iconEl.textContent = '✓';
            iconEl.className = 'icon success';
        } else {
            iconEl.textContent = '✕';
            iconEl.className = 'icon error';
        }
        notificationOverlay.classList.add('visible');
    }

    // ▼▼▼ ДОБАВЛЕННЫЙ БЛОК ДЛЯ МЕНЮ ▼▼▼
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
    // ▲▲▲ КОНЕЦ БЛОКА МЕНЮ ▲▲▲

    // --- Логика отправки формы ---
    const contactForm = document.getElementById('telegram-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';
            
            const orderId = 'IZ-' + String(Date.now()).slice(-6);
            document.getElementById('form-subject').value = `Новая заявка №${orderId} с сайта izumrudtd.ru`;
            
            const formData = new FormData(contactForm);
            const dataForTelegram = Object.fromEntries(formData.entries());
            
            try {
                const results = await Promise.allSettled([
                    sendToFormspree(formData),
                    sendToTelegram(dataForTelegram, orderId)
                ]);
                const formspreeResult = results[0];
                const telegramResult = results[1];
                
                if (formspreeResult.status === 'fulfilled' || telegramResult.status === 'fulfilled') {
                    window.location.href = 'thankyou.html';
                } else {
                    console.error("Ошибка Formspree:", formspreeResult.reason);
                    console.error("Ошибка Telegram:", telegramResult.reason);
                    showNotification(
                        'Ошибка отправки',
                        'Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова или свяжитесь с нами напрямую по телефону.',
                        false
                    );
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            } catch (error) {
                console.error("Общая ошибка при отправке формы:", error);
                showNotification('Ошибка', 'Что-то пошло не так. Пожалуйста, попробуйте еще раз.', false);
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    async function sendToFormspree(formData) {
        if (typeof FORMSPREE_ENDPOINT === 'undefined' || !FORMSPREE_ENDPOINT) {
            throw new Error('Переменная FORMSPREE_ENDPOINT не найдена в config.js');
        }
        try {
            await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });
            return { success: true };
        } catch (error) {
            console.error('Сетевая ошибка при отправке на Formspree:', error);
            throw error;
        }
    }

    async function sendToTelegram(data, orderId) {
        if (typeof BOT_TOKEN === 'undefined' || typeof CHAT_ID === 'undefined') {
            console.warn('BOT_TOKEN или CHAT_ID не определены в config.js. Отправка в Telegram пропущена.');
            return Promise.reject('Ключи для Telegram не настроены');
        }
        let message = `✅ <b>Новая заявка №${orderId}</b>\n\n`;
        message += `<i>Все подробности на почте.</i>`;
        
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=html`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Ошибка при отправке уведомления в Telegram');
        }
        return response.json();
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
    // ▲▲▲ КОНЕЦ БЛОКА ▲▲▲
});