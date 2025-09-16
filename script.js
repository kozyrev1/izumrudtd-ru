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

    // --- Управление модальным окном уведомлений ---
    const notificationOverlay = document.getElementById('notification-overlay');
    const closeNotificationBtn = document.getElementById('notification-close-btn');
    if (notificationOverlay && closeNotificationBtn) {
        closeNotificationBtn.addEventListener('click', () => notificationOverlay.classList.remove('visible'));
        notificationOverlay.addEventListener('click', (e) => {
            if (e.target === notificationOverlay) {
                notificationOverlay.classList.remove('visible');
            }
        });
    }

    function showNotification(title, message, isSuccess = true) {
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

    // --- Логика отправки формы ---
    const contactForm = document.getElementById('telegram-form');
    if (contactForm) {
        const formContainer = document.querySelector('.form-container');
        const successMessageContainer = document.querySelector('.form-success-message');

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            const orderId = 'IZ-' + String(Date.now()).slice(-6);
            document.getElementById('form-subject').value = `Новая заявка №${orderId} с сайта izumrudtd.ru`;

            const formspreePromise = sendToFormspree(new FormData(contactForm));
            const telegramPromise = sendToTelegram(data, orderId);

            const results = await Promise.allSettled([formspreePromise, telegramPromise]);
            const formspreeResult = results[0];

            if (formspreeResult.status === 'fulfilled') {
                // ИЗМЕНЕН ТЕКСТ УСПЕШНОГО УВЕДОМЛЕНИЯ
                showNotification(
                    'Заявка принята!',
                    `Ваша заявка №<b>${orderId}</b> принята. Наш специалист свяжется с вами в течение часа.`,
                    true
                );
                formContainer.style.display = 'none';
                successMessageContainer.classList.add('visible');
                contactForm.reset();
            } else {
                console.error("Ошибка при отправке на Formspree:", formspreeResult.reason);
                showNotification(
                    'Ошибка отправки',
                    'Произошла ошибка. Пожалуйста, попробуйте снова или свяжитесь с нами напрямую.',
                    false
                );
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    async function sendToFormspree(formData) {
        try {
            // Убедимся, что константа из config.js определена
            if (typeof FORMSPREE_ENDPOINT === 'undefined' || !FORMSPREE_ENDPOINT) {
                throw new Error('FORMSPREE_ENDPOINT не определен в config.js!');
            }

            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });
            
            // Если статус ответа 2xx (успех), то всё хорошо. Это главная проверка.
            if (response.ok) {
                return { success: true };
            } else {
                // Если сервер вернул ошибку, пытаемся получить её текст
                let errorText = `Ошибка сервера: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorText = errorData.error;
                    }
                } catch (e) {
                    // Ошибка, если ответ не JSON
                    console.warn("Ответ от Formspree об ошибке не в формате JSON.");
                }
                throw new Error(errorText);
            }
        } catch (error) {
            // Обрабатываем сетевые ошибки (нет интернета и т.д.)
            console.error('Сетевая ошибка или ошибка в логике Formspree:', error);
            throw error; // Передаем ошибку дальше, чтобы Promise.allSettled её поймал
        }
    }

    async function sendToTelegram(data, orderId) {
        // Убраны все персональные данные
        let message = `✅ <b>Новая заявка №${orderId}</b>\n\n`;
        message += `<i>Все подробности на почте.</i>`;

        if (typeof BOT_TOKEN === 'undefined' || typeof CHAT_ID === 'undefined') {
            throw new Error('BOT_TOKEN или CHAT_ID не определены в config.js!');
        }
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=html`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Ошибка отправки в Telegram');
        }
        return response.json();
    }
});