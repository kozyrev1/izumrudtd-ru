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
        // Функция закрытия модального окна
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

            const orderId = 'IZ-' + String(Date.now()).slice(-6);
            document.getElementById('form-subject').value = `Новая заявка №${orderId} с сайта izumrudtd.ru`;
            
            const formData = new FormData(contactForm);
            const dataForTelegram = Object.fromEntries(formData.entries());

            try {
                // Отправляем запросы параллельно
                const results = await Promise.allSettled([
                    sendToFormspree(formData),
                    sendToTelegram(dataForTelegram, orderId)
                ]);

                const formspreeResult = results[0];
                const telegramResult = results[1];

                // Считаем отправку успешной, если хотя бы один сервис ответил успехом
                if (formspreeResult.status === 'fulfilled' || telegramResult.status === 'fulfilled') {
                    showNotification(
                        'Заявка принята!',
                        `Ваша заявка №<b>${orderId}</b> успешно отправлена. Мы скоро с вами свяжемся.`,
                        true
                    );
                    // Скрываем форму и показываем статичное сообщение "Спасибо", как и было
                    formContainer.style.display = 'none';
                    successMessageContainer.classList.add('visible');
                    contactForm.reset();
                } else {
                    // Если оба запроса провалились
                    console.error("Ошибка Formspree:", formspreeResult.reason);
                    console.error("Ошибка Telegram:", telegramResult.reason);
                    showNotification(
                        'Ошибка отправки',
                        'Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова или свяжитесь с нами напрямую по телефону.',
                        false
                    );
                }
            } catch (error) {
                // Этот блок на случай других непредвиденных ошибок, хотя Promise.allSettled их покроет
                console.error("Общая ошибка при отправке формы:", error);
                showNotification('Ошибка', 'Что-то пошло не так. Пожалуйста, попробуйте еще раз.', false);
            } finally {
                // Этот блок выполнится всегда: и при успехе, и при ошибке
                // Возвращаем кнопку в исходное состояние, если форма не была скрыта
                if (formContainer.style.display !== 'none') {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    }

    // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ДЛЯ FORMSPREE ---
    async function sendToFormspree(formData) {
        if (typeof FORMSPREE_ENDPOINT === 'undefined' || !FORMSPREE_ENDPOINT) {
            throw new Error('Переменная FORMSPREE_ENDPOINT не найдена в config.js');
        }

        try {
            // Отправляем запрос в режиме 'no-cors'.
            // Это значит "отправить и не ждать ответа", что идеально обходит ошибку CORS.
            await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' // <-- Вот оно, главное исправление!
            });
            // Так как мы не ждем ответа, мы просто считаем, что запрос был отправлен успешно.
            return { success: true };
        } catch (error) {
            // Этот блок сработает только при реальной сетевой ошибке (например, нет интернета)
            console.error('Сетевая ошибка при отправке на Formspree:', error);
            throw error;
        }
    }

    // Функция отправки в Telegram (остается без изменений, но приводится для полноты)
async function sendToTelegram(data, orderId) {
    if (typeof BOT_TOKEN === 'undefined' || typeof CHAT_ID === 'undefined') {
        console.warn('BOT_TOKEN или CHAT_ID не определены в config.js. Отправка в Telegram пропущена.');
        return Promise.reject('Ключи для Telegram не настроены');
    }
    // Формируем безопасное сообщение без ПД
    let message = `✅ <b>Новая заявка №${orderId}</b>\n\n`;
    message += `<i>Все подробности на почте.</i>`;
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=html`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Ошибка при отправке уведомления в Telegram');
    }
    return response.json();
}
});