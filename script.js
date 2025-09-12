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

    // --- УЛУЧШЕННЫЙ БЛОК ОТПРАВКИ ФОРМЫ ---
    const contactForm = document.getElementById('telegram-form'); 

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const privacyCheckbox = document.getElementById('privacy-agree');
            if (!privacyCheckbox.checked) {
                alert('Пожалуйста, подтвердите ваше согласие с Политикой конфиденциальности.');
                return;
            }

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            // 1. Блокируем кнопку для защиты от повторных нажатий
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            // 2. Создаем два независимых запроса: один на почту, другой в Telegram
            
            // Запрос №1: Основной - отправка на Email через Formspree
            const formspreePromise = fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Accept': 'application/json' }
            });

            // Запрос №2: Уведомление - отправка в Telegram (с минимумом ПД)
            let telegramMessage = `✅ <b>Новая заявка с сайта izumrudtd.ru</b>\n\n`;
            telegramMessage += `<b>Имя:</b> ${data.name}\n`;
            telegramMessage += `<b>Телефон:</b> ${data.phone}\n\n`;
            telegramMessage += `<i>Подробности отправлены на почту.</i>`;

            const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(telegramMessage)}&parse_mode=html`;
            const telegramPromise = fetch(telegramUrl);

            // 3. Ждем выполнения ОБЕИХ операций, неважно, успешны они или нет
            Promise.allSettled([formspreePromise, telegramPromise])
                .finally(() => {
                    // 4. После того, как все завершилось, показываем общее сообщение об успехе и разблокируем кнопку
                    alert('Спасибо! Ваша заявка отправлена. Мы скоро свяжемся с вами.');
                    contactForm.reset();
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                });
        });
    }
});