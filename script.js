document.addEventListener('DOMContentLoaded', function() {

    // --- БЛОК УПРАВЛЕНИЯ МОДАЛЬНЫМ ОКНОМ COOKIE ---
    const modalOverlay = document.getElementById('cookie-modal-overlay');
    const acceptBtn = document.getElementById('cookie-accept-btn');

    if (!localStorage.getItem('cookieConsent')) {
        modalOverlay.classList.add('active');
    }

    acceptBtn.addEventListener('click', function() {
        localStorage.setItem('cookieConsent', 'true');
        modalOverlay.classList.remove('active');
    });

    // --- ФИНАЛЬНЫЙ БЛОК ОТПРАВКИ ФОРМЫ ---
    const contactForm = document.getElementById('telegram-form'); 

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const privacyCheckbox = document.getElementById('privacy-agree');
            if (!privacyCheckbox.checked) {
                alert('Пожалуйста, подтвердите ваше согласие с Политикой конфиденциальности.');
                return;
            }

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            // 1. Генерируем уникальный номер заявки
            const orderId = 'IZ-' + String(Date.now()).slice(-6);

            // 2. Устанавливаем тему письма. Поле _cc удалено, т.к. это платная функция.
            document.getElementById('form-subject').value = `Новая заявка №${orderId} с сайта izumrudtd.ru`;
            
            // 3. Отправляем ОБА запроса параллельно
            try {
                // Главный запрос - на почту. Если он не пройдет, будет ошибка.
                await sendToFormspree(new FormData(contactForm));

                // Уведомление в Telegram. Его возможная ошибка не повлияет на пользователя.
                sendToTelegram(data, orderId);

                // УЛУЧШЕННОЕ СООБЩЕНИЕ ДЛЯ ПОЛЬЗОВАТЕЛЯ
                alert(`Спасибо! Ваша заявка №${orderId} принята. Мы скоро свяжемся с вами.`);
                contactForm.reset();

            } catch (error) {
                console.error("Ошибка при отправке на Formspree:", error);
                alert('Произошла ошибка при отправке. Пожалуйста, попробуйте снова или свяжитесь с нами напрямую.');
            } finally {
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
            throw new Error(`Ошибка Formspree: ${response.statusText}`);
        }
        return response.json();
    }

    async function sendToTelegram(data, orderId) {
        // ОБНОВЛЕННОЕ, БЕЗОПАСНОЕ СООБЩЕНИЕ В TELEGRAM
        let telegramMessage = `✅ <b>Новая заявка №${orderId}</b>\n\n`;
        telegramMessage += `<b>Имя:</b> ${data.name}\n`;
        // Мы больше не отправляем телефон и суть запроса в Telegram для соблюдения ФЗ-152
        telegramMessage += `\n<i>Все подробности на почте.</i>`;

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(telegramMessage)}&parse_mode=html`;
        
        try {
            const response = await fetch(telegramUrl);
            if (!response.ok) {
                // Логируем ошибку для себя, но не беспокоим пользователя
                console.error('Ошибка отправки в Telegram: ', await response.json());
            }
        } catch (error) {
            console.error('Сетевая ошибка при отправке в Telegram: ', error);
        }
    }
});