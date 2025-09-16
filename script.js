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
        messageEl.innerHTML = message; // Используем innerHTML для возможности вставлять теги

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

            if (!document.getElementById('privacy-agree').checked) {
                showNotification('Требуется согласие', 'Пожалуйста, подтвердите ваше согласие с Политикой конфиденциальности.', false);
                return;
            }

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            const orderId = 'IZ-' + String(Date.now()).slice(-6);
            document.getElementById('form-subject').value = `Новая заявка №${orderId} с сайта izumrudtd.ru`;

            // Улучшенная логика отправки
            const formspreePromise = sendToFormspree(new FormData(contactForm));
            const telegramPromise = sendToTelegram(data, orderId);

            // Promise.allSettled дождется выполнения всех промисов, независимо от их результата
            const results = await Promise.allSettled([formspreePromise, telegramPromise]);
            const formspreeResult = results[0];

            if (formspreeResult.status === 'fulfilled') {
                // Главный канал (почта) сработал - это успех
                showNotification(
                    'Заявка принята!',
                    `Спасибо! Ваша заявка №<b>${orderId}</b> успешно отправлена. Наш менеджер скоро свяжется с вами.`,
                    true
                );
                formContainer.style.display = 'none'; // Скрываем форму
                successMessageContainer.classList.add('visible'); // Показываем сообщение об успехе
                contactForm.reset();
            } else {
                // Ошибка отправки на почту - это критично
                console.error("Ошибка при отправке на Formspree:", formspreeResult.reason);
                showNotification(
                    'Ошибка отправки',
                    'Произошла ошибка. Пожалуйста, попробуйте снова или свяжитесь с нами напрямую.',
                    false
                );
                // В случае ошибки, снова включаем кнопку
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    async function sendToFormspree(formData) {
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка Formspree: ${errorData.error || response.statusText}`);
        }
        return response.json();
    }

    async function sendToTelegram(data, orderId) {
        let message = `✅ <b>Заявка №${orderId} с сайта</b>\n\n`;
        message += `<b>Имя:</b> ${data.name || 'Не указано'}\n`;
        message += `<b>Телефон:</b> ${data.phone || 'Не указан'}\n`;
        if (data.company) {
            message += `<b>Компания:</b> ${data.company}\n`;
        }
        message += `\n<i>Подробности на почте.</i>`;

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